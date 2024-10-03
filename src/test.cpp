#include "eigen-3.4.0/Eigen/Dense"
#include "tide_harmonics.hpp"
#include <cassert>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>

const std::vector<double> Pulsations = {
    0.262516,    //
    0.525032,    //
    0.515369,    //
    0.505868,    //
    0.0191643,   //
    0.00950113,  //
    0.496367,    //
    0.243352,    //
    0.261083,    //
    0.233851,    //
    0.523599,    //
    0.000716782, //
    0.00143357,  //
    0.522882,    //
};

const std::vector<double> Amplitudes = {
    0.0594796, //
    0.191575,  //
    0.0710532, //
    1.19205,   //
    0.0541227, //
    0.1756535, //
    0.354644,  //
    0.0838648, //
    0.0242216, //
    0.0324355, //
    0.539035,  //
    0.332835,  //
    0.20931,   //
    0.0866274, //
};

const std::vector<double> Phases = {
    1.0594796, //
    0.191575,  //
    0.0710532, //
    -1.19205,  //
    0.0541227, //
    9.1756535, //
    2.354644,  //
    0.0838648, //
    0.0242216, //
    3.0324355, //
    -7.539035, //
    1.332835,  //
    -5.20931,  //
    2.0866274, //
};

auto range(double x0, double x1, int n) -> std::vector<double> {
  std::vector<double> r(n);
  double dx = (x1 - x0) / n;
  for (int i = 0; i < n; ++i) {
    r.at(i) = x0 + i * dx;
  }
  return r;
}

auto test_harmonic_analysis() {

  std::vector<double> t = range(0.0, 20000.0, 20000);
  std::vector<double> h =
      Tide::harmonic_series(t, Pulsations, Phases, Amplitudes);

  double h_m = Tide::mean(h);
  for (auto &v : h) {
    v -= h_m;
  }

  std::vector<double> amplitudes_fit(Pulsations.size());
  std::vector<double> phases_fit(Pulsations.size());

  Tide::harmonic_analysis(t, h, Pulsations, phases_fit, amplitudes_fit);

  Eigen::Map<Eigen::VectorXd> amplitudes_fit_eigen(amplitudes_fit.data(),
                                                   (long)amplitudes_fit.size());

  std::vector<double> amplitudes = Amplitudes;
  std::vector<double> pulsations = Pulsations;
  Eigen::Map<Eigen::VectorXd> amplitudes_eigen(amplitudes.data(),
                                               (long)amplitudes.size());

  Eigen::Map<Eigen::VectorXd> pulsations_eigen(pulsations.data(),
                                               (long)pulsations.size());

  Eigen::VectorXd residual = (amplitudes_eigen - amplitudes_fit_eigen)
                                 .cwiseAbs()
                                 .cwiseProduct(pulsations_eigen);

  double error = residual.maxCoeff();
  std::cout << "harmonic_analysis on Ideal signal, error inf : " << error
            << "\n";
  assert(error < 1.0e-5);
}

auto test_read_csv_data() {
  std::vector<double> t;
  std::vector<double> h;

  Tide::read_csv_data("test_data.txt", t, h);

  double h_m = Tide::mean(h);
  for (auto &v : h) {
    v -= h_m;
  }
  std::vector<std::string> names;
  std::vector<double> pulsations;
  Tide::get_constituants_const(names, pulsations);

  std::vector<double> phases(pulsations.size());
  std::vector<double> amplitudes(pulsations.size());

  Tide::harmonic_analysis(t, h, pulsations, phases, amplitudes);

  std::vector<double> h_fit =
      Tide::harmonic_series(t, pulsations, phases, amplitudes);

  Eigen::Map<Eigen::VectorXd> h_eigen(h.data(), (long)h.size());
  Eigen::Map<Eigen::VectorXd> h_fit_eigen(h_fit.data(), (long)h_fit.size());

  Eigen::VectorXd residual = (h_fit_eigen - h_eigen).cwiseAbs();
  double error = residual.sum() / (double)residual.rows();

  std::cout << "read_csv_data, mean error : " << error << "\n";
  assert(error < 2.0e-2);
}

auto test_read_csv_string() {
  std::vector<double> t;
  std::vector<double> h;

  std::ifstream file;

  file.open("test_data.txt", std::ios::in);
  if (file.fail()) {
    std::cout << "Error, can't open : " << "test_data" << "\n";
    exit(1);
  }
  std::stringstream buffer;
  buffer << file.rdbuf();
  std::string data_str(buffer.str());
  file.close();

  const char *format = "%d/%m/%Y %H:%M:%S";
  std::string datetime;
  Tide::read_csv_string(data_str, format, ';', 0, 1, t, h, datetime);

  double h_m = Tide::mean(h);
  for (auto &v : h) {
    v -= h_m;
  }
  std::vector<std::string> names;
  std::vector<double> pulsations;
  Tide::get_constituants_const(names, pulsations);

  std::vector<double> phases(pulsations.size());
  std::vector<double> amplitudes(pulsations.size());

  Tide::harmonic_analysis(t, h, pulsations, phases, amplitudes);

  std::vector<double> h_fit =
      Tide::harmonic_series(t, pulsations, phases, amplitudes);

  Eigen::Map<Eigen::VectorXd> h_eigen(h.data(), (long)h.size());
  Eigen::Map<Eigen::VectorXd> h_fit_eigen(h_fit.data(), (long)h_fit.size());

  Eigen::VectorXd residual = (h_fit_eigen - h_eigen).cwiseAbs();
  double error = residual.sum() / (double)residual.rows();

  std::cout << "read_csv_string, mean error : " << error << "\n";
  assert(error < 2.0e-2);
}

auto toTextFormat(std::vector<double> &t,
                  std::vector<double> &h) -> std::string {
  std::stringstream ss;
  for (int i = 0; i < (int)h.size(); ++i) {
    ss << std::to_string(t.at(i)) << " ";
    ss << std::to_string(h.at(i)) << "\n";
  }
  return ss.str();
}

auto test_read_csv_string_units() {
  std::vector<double> t = range(0.0, 8000.0, 16000);
  std::vector<double> h =
      Tide::harmonic_series(t, Pulsations, Phases, Amplitudes);

  std::string data_str = toTextFormat(t, h);

  std::string datetime;
  Tide::read_csv_string_units(data_str, ' ', 0, 1, 3600.0, t, h, datetime);

  std::vector<double> phases(Pulsations.size());
  std::vector<double> amplitudes(Pulsations.size());

  Tide::harmonic_analysis(t, h, Pulsations, phases, amplitudes);

  std::vector<double> h_fit =
      Tide::harmonic_series(t, Pulsations, phases, amplitudes);

  Eigen::Map<Eigen::VectorXd> h_eigen(h.data(), (long)h.size());
  Eigen::Map<Eigen::VectorXd> h_fit_eigen(h_fit.data(), (long)h_fit.size());

  Eigen::VectorXd residual = (h_fit_eigen - h_eigen).cwiseAbs();
  double error = residual.sum() / (double)residual.rows();

  std::cout << "read_csv_string_unit, mean error : " << error << "\n";
  assert(error < 2.0e-6);
}

auto main() -> int {

  test_harmonic_analysis();

  test_read_csv_data();

  test_read_csv_string();

  test_read_csv_string_units();

  return 0;
}
