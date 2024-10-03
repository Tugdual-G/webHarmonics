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

template <typename T>
auto Components<T>::build_lsq_matrix(const std::vector<T> &t)
    -> Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic> {
  /* pulsation in rad per hours, t in hours */

  auto m = (long int)t.size();
  auto n = (long int)pulsations.size() * 2;
  Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic> A(m, n);

  for (long int i = 0; i < m; ++i) {
    for (long int j = 0; j < n / 2; ++j) {
      A(i, j * 2) = std::cos(pulsations.at(j) * t.at(i));
      A(i, j * 2 + 1) = std::sin(pulsations.at(j) * t.at(i));
    }
  }

  return A;
}

template <typename T>
auto Components<T>::extract_amplitudes(Eigen::Matrix<T, Eigen::Dynamic, 1> &X) {

  amplitudes.resize(X.rows() / 2);
  for (long int i = 0; i < (long int)amplitudes.size(); ++i) {
    amplitudes.at(i) =
        std::pow(X(i * 2) * X(i * 2) + X(i * 2 + 1) * X(i * 2 + 1), 0.5);
  }
}

template <typename T>
auto Components<T>::extract_phases(Eigen::Matrix<T, Eigen::Dynamic, 1> &X) {

  phases.resize(X.rows() / 2);

  for (long int i = 0; i < (long int)phases.size(); ++i) {
    phases.at(i) = std::atan2(X(i * 2), X(i * 2 + 1)) - (T)PI * 0.5;
  }
}

template <typename T>
auto Components<T>::harmonic_series(const std::vector<T> &t) -> std::vector<T> {

  if (pulsations.size() != phases.size() ||
      pulsations.size() != amplitudes.size()) {
    throw std::invalid_argument("The components size don't match in " +
                                std::string(__func__) + "\n");
  }

  if (pulsations.empty()) {
    throw std::invalid_argument("empty components in " + std::string(__func__) +
                                "\n");
  }

  std::vector<T> h(t.size(), 0.0);

  for (long int i = 0; i < (long int)t.size(); ++i) {
    for (long int j = 0; j < (long int)pulsations.size(); ++j) {
      h.at(i) += amplitudes.at(j) *
                 std::cos(pulsations.at(j) * t.at(i) + phases.at(j));
    }
  }
  return h;
}

template <typename T> auto Tide::mean(std::vector<T> &x) -> T {
  T s{0};
  for (auto &v : x) {
    s += v;
  }
  return s / (T)x.size();
}

template <typename T>
void Components<T>::harmonic_analysis(const std::vector<T> &times,
                                      const std::vector<T> &heights) {

  if (times.size() != heights.size()) {
    throw std::invalid_argument("vectors sizes don't match in " +
                                std::string(__func__) + "\n");
  }

  if (pulsations.empty()) {
    throw std::invalid_argument("Pulsation vector is empty in " +
                                std::string(__func__) + "\n");
  }

  auto h = heights;

  Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic> A =
      Components::build_lsq_matrix(times);

  Eigen::Map<Eigen::VectorXd> h_eigen(h.data(), (long)h.size());

  // Eigen::Matrix<T, Eigen::Dynamic, 1> cs_amplitudes =
  //     A.colPivHouseholderQr().solve(h_eigen);

  Eigen::Matrix<T, Eigen::Dynamic, 1> X =
      A.bdcSvd(Eigen::ComputeThinU | Eigen::ComputeThinV).solve(h_eigen);

  Components::extract_amplitudes(X);
  Components::extract_phases(X);
}

template <typename T>
void Components<T>::set_pulsations(const std::vector<T> &pulsations_in) {
  pulsations = pulsations_in;
}

template <typename T>
void Components<T>::set_pulsations(const T *pulsations_in, int size) {
  pulsations.resize(size);
  std::copy(pulsations_in, pulsations_in + size, pulsations.begin());
}

template <typename T>
void Components<T>::set_amplitudes(const std::vector<T> &amplitudes_in) {
  if (pulsations.size() != amplitudes_in.size() && !pulsations.empty()) {
    throw std::invalid_argument("vectors sizes don't match in " +
                                std::string(__func__) + "\n");
  }
  amplitudes = amplitudes_in;
}

template <typename T>
void Components<T>::set_amplitudes(const T *amplitudes_in, int size) {
  if ((int)pulsations.size() != size && !pulsations.empty()) {
    throw std::invalid_argument("vectors sizes don't match in " +
                                std::string(__func__) + "\n");
  }
  amplitudes.resize(size);
  std::copy(amplitudes_in, amplitudes_in + size, amplitudes.begin());
}

template <typename T>
void Components<T>::set_phases(const std::vector<T> &phases_in) {
  if (pulsations.size() != phases_in.size() && !pulsations.empty()) {
    throw std::invalid_argument("vectors sizes don't match in " +
                                std::string(__func__) + "\n");
  }
  phases = phases_in;
}

template <typename T>
void Components<T>::set_phases(const T *phases_in, int size) {
  if ((int)pulsations.size() != size && !pulsations.empty()) {
    throw std::invalid_argument("vectors sizes don't match in " +
                                std::string(__func__) + "\n");
  }
  phases.resize(size);
  std::copy(phases_in, phases_in + size, phases.begin());
}

template <typename T>
auto Components<T>::error_inf(const std::vector<T> &t,
                              const std::vector<T> &h) -> T {
  if (t.size() != h.size()) {
    throw std::invalid_argument("vectors sizes don't match in " +
                                std::string(__func__) + "\n");
  }
  std::vector<T> h_fit = harmonic_series(t);
  T error{0};
  T dif{0};
  for (long int i = 0; i < (long int)h.size(); ++i) {
    dif = std::abs(h_fit[i] - h[i]);
    if (dif > error) {
      error = dif;
    }
  }

  return error;
}

template <typename T>
auto Components<T>::error_mean(const std::vector<T> &t,
                               const std::vector<T> &h) -> T {
  if (t.size() != h.size()) {
    throw std::invalid_argument("vectors sizes don't match in " +
                                std::string(__func__) + "\n");
  }

  std::vector<T> h_fit = harmonic_series(t);
  T error{0};
  for (long int i = 0; i < (long int)h.size(); ++i) {
    error += std::abs(h_fit[i] - h[i]);
  }

  return error / (T)h.size();
}

template <typename T>
auto Components<T>::error_2(const std::vector<T> &t,
                            const std::vector<T> &h) -> T {
  if (t.size() != h.size()) {
    throw std::invalid_argument("vectors sizes don't match in " +
                                std::string(__func__) + "\n");
  }

  std::vector<T> h_fit = harmonic_series(t);
  T error{0};
  for (long int i = 0; i < (long int)h.size(); ++i) {
    error += (h_fit[i] - h[i]) * (h_fit[i] - h[i]);
  }

  return error;
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

void read_csv_string(const std::string &csv, const char *format, char sep,
                     int col_t, int col_h, std::vector<double> &time,
                     std::vector<double> &value, std::string &datetime_str) {

  time.resize(0);
  value.resize(0);
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

void read_csv_string_units(const std::string &csv, char sep, int col_t,
                           int col_h, double units, std::vector<double> &time,
                           std::vector<double> &value,
                           std::string &datetime_str) {

  time.resize(0);
  value.resize(0);
  std::stringstream csv_stream(csv);
  std::string line = "#";

  double val{-999999.0};

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

void read_csv_data(std::string fname, std::vector<double> &time,
                   std::vector<double> &value) {

  std::ifstream file;
  time.resize(0);
  value.resize(0);

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

template class Components<double>;
template double Tide::mean(std::vector<double> &v);
