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

  Components components(Pulsations);
  components.set_amplitudes(Amplitudes);
  components.set_phases(Phases);

  std::vector<double> t = range(0.0, 20000.0, 20000);
  std::vector<double> h = components.harmonic_series(t);

  components.harmonic_analysis(t, h);

  double error = components.error_inf(t, h);
  std::cout << "harmonic_analysis on Ideal signal, error inf : " << error
            << "\n";
  assert(error < 1.0e-12);
}

auto test_setters() {

  Components<double> components;
  components.set_pulsations(Pulsations.data(), (int)Pulsations.size());
  components.set_amplitudes(Amplitudes.data(), (int)Amplitudes.size());
  components.set_phases(Phases.data(), (int)Phases.size());

  std::vector<double> t = range(0.0, 20000.0, 20000);
  std::vector<double> h = components.harmonic_series(t);

  components.harmonic_analysis(t, h);

  double error = components.error_inf(t, h);
  std::cout << "setters, error inf : " << error << "\n";
  assert(error < 1.0e-12);
}

auto test_read_csv_data() {
  std::vector<double> t;
  std::vector<double> h;

  read_csv_data("test_data.txt", t, h);

  double h_m = Tide::mean(h);
  for (auto &v : h) {
    v -= h_m;
  }
  std::vector<std::string> names;
  std::vector<double> pulsations;
  Tide::get_constituants_const(names, pulsations);

  Components components(pulsations);

  components.harmonic_analysis(t, h);

  double error = components.error_mean(t, h);

  std::cout << "read_csv_data, mean error : " << error << "\n";
  assert(error < 1.0e-2);
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
  read_csv_string(data_str, format, ';', 0, 1, t, h, datetime);

  double h_m = Tide::mean(h);
  for (auto &v : h) {
    v -= h_m;
  }
  std::vector<std::string> names;
  std::vector<double> pulsations;
  Tide::get_constituants_const(names, pulsations);
  Components components(pulsations);

  components.harmonic_analysis(t, h);
  double error = components.error_mean(t, h);

  std::cout << "read_csv_string, mean error : " << error << "\n";
  assert(error < 2.0e-2);
}

auto toTextFormat(std::vector<double> &t,
                  std::vector<double> &h) -> std::string {
  std::stringstream ss;
  ss.precision(14);
  ss << std::scientific;
  for (int i = 0; i < (int)h.size(); ++i) {
    ss << t.at(i) << " ";
    ss << h.at(i) << "\n";
  }
  return ss.str();
}

auto test_read_csv_string_units() {
  Components components(Pulsations);
  components.set_phases(Phases);
  components.set_amplitudes(Amplitudes);

  std::vector<double> t = range(0.0, 20000.0, 20000);
  std::vector<double> h = components.harmonic_series(t);

  std::string data_str = toTextFormat(t, h);

  std::string datetime;
  read_csv_string_units(data_str, ' ', 0, 1, 3600.0, t, h, datetime);

  components.harmonic_analysis(t, h);
  double error = components.error_mean(t, h);

  std::cout << "read_csv_string_unit, mean error : " << error << "\n";
  assert(error < 1.0e-12);
}

auto main() -> int {

  test_harmonic_analysis();

  test_read_csv_data();

  test_read_csv_string();

  test_read_csv_string_units();

  test_setters();
  return 0;
}
