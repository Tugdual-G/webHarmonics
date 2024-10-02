#include "tide_harmonics.hpp"
#include "eigen-3.4.0/Eigen/Dense"
#include <algorithm>
#include <cmath>
#include <ctime>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

constexpr double PI{3.141592653589793};

void Tide::read_csv_data(std::string fname, std::vector<double> &time,
                         std::vector<double> &value) {

  std::ifstream file;

  file.open(fname, std::ios::in);
  if (file.fail()) {
    std::cout << "Error, can't open : " << fname << "\n";
    exit(1);
  }

  const char *format = "%d/%m/%Y %H:%M:%S";
  std::tm t = {};
  std::time_t timestamp{0};
  std::time_t timestamp_t0{0};

  std::string line = "#";

  while (line.starts_with("#")) {
    if (!getline(file, line)) {
      std::cout << "Error, cannot read : " << fname << "\n";
      exit(1);
    }
  }

  {
    std::stringstream ss(line);
    std::string token;
    if (getline(ss, token, ';')) {
      std::stringstream datetime_string(token);
      datetime_string >> std::get_time(&t, format);
      timestamp_t0 = std::mktime(&t);
      time.push_back(0.0);
    }

    if (getline(ss, token, ';')) {
      value.push_back(std::stod(token));
    }
  }

  while (getline(file, line)) {
    std::stringstream ss(line);
    std::string token;

    if (getline(ss, token, ';')) {
      std::stringstream datetime_string(token);
      datetime_string >> std::get_time(&t, format);
      timestamp = std::mktime(&t) - timestamp_t0;
      time.push_back((double)timestamp / 3600.0);
    }

    if (getline(ss, token, ';')) {
      value.push_back(std::stod(token));
    }
  }
  file.close();
}

void Tide::get_constituants_const(std::vector<std::string> &names,
                                  std::vector<double> &pulsation) {
  for (auto const &[key, val] : TIDAL_CONST) {
    names.push_back(key);
    pulsation.push_back(PI * val / 180.0);
  }
}

auto Tide::build_lsq_matrix(const std::vector<double> &t,
                            const std::vector<double> &pulsations)
    -> Eigen::Matrix<double, Eigen::Dynamic, Eigen::Dynamic> {
  /* pulsation in rad per hours, t in hours */

  int m = (int)t.size();
  int n = (int)pulsations.size() * 2;
  Eigen::Matrix<double, Eigen::Dynamic, Eigen::Dynamic> A(m, n);

  for (int i = 0; i < m; ++i) {
    for (int j = 0; j < n / 2; ++j) {
      A(i, j * 2) = std::cos(pulsations.at(j) * t.at(i));
      A(i, j * 2 + 1) = std::sin(pulsations.at(j) * t.at(i));
    }
  }

  return A;
}

auto Tide::get_amplitudes(Eigen::Matrix<double, Eigen::Dynamic, 1> &cs_ampl)
    -> std::vector<double> {
  std::vector<double> ampl(cs_ampl.rows() / 2);
  for (int i = 0; i < (int)ampl.size(); ++i) {
    ampl.at(i) = std::pow(cs_ampl(i * 2) * cs_ampl(i * 2) +
                              cs_ampl(i * 2 + 1) * cs_ampl(i * 2 + 1),
                          0.5);
  }
  return ampl;
}

auto Tide::get_phases(Eigen::Matrix<double, Eigen::Dynamic, 1> &cs_ampl)
    -> std::vector<double> {
  std::vector<double> phases(cs_ampl.rows() / 2);
  for (int i = 0; i < (int)phases.size(); ++i) {
    phases.at(i) = std::atan2(cs_ampl(i * 2), cs_ampl(i * 2 + 1)) - PI * 0.5;
  }
  return phases;
}

auto Tide::harmonic_series(
    const std::vector<double> &t, const std::vector<double> &pulsation,
    const std::vector<double> &phase,
    const std::vector<double> &amplitude) -> std::vector<double> {

  std::vector<double> h(t.size(), 0.0);
  for (int i = 0; i < (int)t.size(); ++i) {
    for (int j = 0; j < (int)pulsation.size(); ++j) {
      h.at(i) +=
          amplitude.at(j) * std::cos(pulsation.at(j) * t.at(i) + phase.at(j));
    }
  }
  return h;
}

auto Tide::mean(std::vector<double> &x) -> double {
  double s{0};
  for (auto &v : x) {
    s += v;
  }
  return s / (double)x.size();
}

void Tide::harmonic_analysis(const std::vector<double> &times,
                             const std::vector<double> &heights,
                             const std::vector<double> &pulsations,
                             double mean_height, std::vector<double> &phases,
                             std::vector<double> &amplitudes) {

  if (times.size() != heights.size()) {
    throw std::invalid_argument("vectors size don't match " +
                                std::string(__func__) + "\n");
  }

  if (amplitudes.size() != phases.size() ||
      phases.size() != pulsations.size()) {
    throw std::invalid_argument("vectors size don't match " +
                                std::string(__func__) + "\n");
  }

  auto h = heights;
  for (auto &v : h) {
    v = v - mean_height;
  }

  Eigen::Matrix<double, Eigen::Dynamic, Eigen::Dynamic> A =
      Tide::build_lsq_matrix(times, pulsations);

  Eigen::Map<Eigen::VectorXd> h_eigen(h.data(), (long)h.size());

  // Eigen::Matrix<double, Eigen::Dynamic, 1> cs_amplitudes =
  //     A.colPivHouseholderQr().solve(h_eigen);

  Eigen::Matrix<double, Eigen::Dynamic, 1> cs_amplitudes =
      A.bdcSvd(Eigen::ComputeThinU | Eigen::ComputeThinV).solve(h_eigen);

  auto amplitudes_tmp = Tide::get_amplitudes(cs_amplitudes);
  auto phases_tmp = Tide::get_phases(cs_amplitudes);

  std::copy(amplitudes_tmp.begin(), amplitudes_tmp.end(), amplitudes.begin());
  std::copy(phases_tmp.begin(), phases_tmp.end(), phases.begin());
}

auto get_column(std::stringstream &ss, std::string &token, char sep,
                int col) -> bool {
  ss.clear();
  ss.seekg(0, std::ios_base::beg);
  int i = 0;
  while (std::getline(ss, token, sep) && i < col) {
    ++i;
  }
  return true;
}

void Tide::read_csv_string(const std::string &csv, const char *format, char sep,
                           int col_t, int col_h, std::vector<double> &time,
                           std::vector<double> &value,
                           std::string &datetime_str) {

  std::stringstream csv_stream(csv);
  // const char *format = "%d/%m/%Y %H:%M:%S";
  std::tm t = {};
  std::time_t timestamp{0};
  std::time_t timestamp_t0{0};

  std::string line = "#";

  // Pass through the header
  while (getline(csv_stream, line)) {
    std::stringstream ss(line);
    std::string token;
    if (get_column(ss, token, sep, col_t)) {
      // if (getline(ss, token, sep)) {
      std::stringstream datetime_string(token);
      datetime_string >> std::get_time(&t, format);
      if (!datetime_string.fail()) {
        datetime_str = token;
        timestamp_t0 = std::mktime(&t);
        time.push_back(0.0);
        if (get_column(ss, token, sep, col_h)) {
          // if (getline(ss, token, sep)) {
          value.push_back(std::stod(token));
        }
        break;
      }
    }
  }

  while (getline(csv_stream, line)) {
    std::stringstream ss(line);
    std::string token;

    if (get_column(ss, token, sep, col_t)) {
      // if (getline(ss, token, sep)) {
      std::stringstream datetime_string(token);
      datetime_string >> std::get_time(&t, format);
      if (!datetime_string.fail()) {
        timestamp = std::mktime(&t) - timestamp_t0;
        time.push_back((double)timestamp / 3600.0);
        if (get_column(ss, token, sep, col_h)) {
          // if (getline(ss, token, sep)) {
          value.push_back(std::stod(token));
        }
      }
    }
  }
}

auto valid_float(std::string &str, double *value) -> bool {
  try {
    *value = std::stod(str);
  } catch (const std::exception &) {
    return false;
  }
  return true;
}

void Tide::read_csv_string_units(const std::string &csv, char sep, int col_t,
                                 int col_h, double units,
                                 std::vector<double> &time,
                                 std::vector<double> &value,
                                 std::string &datetime_str) {

  std::stringstream csv_stream(csv);
  std::string line = "#";

  double val{1.5};

  while (getline(csv_stream, line)) {
    std::stringstream ss(line);
    std::string token;
    if (get_column(ss, token, sep, col_t)) {
      if (valid_float(token, &val)) {
        time.push_back(units * val / 3600.0);
        if (get_column(ss, token, sep, col_h)) {
          value.push_back(std::stod(token));
        }
      }
    }
  }
  datetime_str = std::to_string(time.at(0));
}
