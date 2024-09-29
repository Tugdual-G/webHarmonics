#include "eigen-3.4.0/Eigen/Dense"
#include "tide_harmonics.hpp"
#include <cassert>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>

auto range(double x0, double x1, int n) -> std::vector<double> {
  std::vector<double> r(n);
  double dx = (x1 - x0) / n;
  for (int i = 0; i < n; ++i) {
    r.at(i) = x0 + i * dx;
  }
  return r;
}

void write_data(std::string fname, const std::vector<double> &c0,
                const std::vector<double> &c1) {
  std::ofstream file;
  file.open(fname);
  if (file.fail()) {
    exit(1);
  }
  for (int i = 0; i < (int)c1.size(); ++i) {
    file << c0.at(i) << " ";
    file << c1.at(i) << "\n";
  }
  file.close();
}

auto main() -> int {
  std::vector<double> t;
  std::vector<double> h;

  Tide::read_csv_data("../data/95_2023.txt", t, h);

  double h_m = Tide::mean(h);
  for (auto &v : h) {
    v -= h_m;
  }

  write_data("data.txt", t, h);

  std::vector<std::string> names;
  std::vector<double> pulsations;

  Tide::get_constituants_const(names, pulsations);

  std::vector<double> phases(pulsations.size());
  std::vector<double> amplitudes(pulsations.size());
  Tide::harmonic_analysis(t, h, pulsations, 0.0, phases, amplitudes);

  auto t_fit = range(t.at(0), t.at(t.size() - 1), (int)t.size() * 4);
  std::vector<double> h_fit =
      Tide::harmonic_series(t_fit, pulsations, phases, amplitudes);

  write_data("data_fit.txt", t_fit, h_fit);

  return 0;
}
