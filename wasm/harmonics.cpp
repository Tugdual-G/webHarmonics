#include "../../emsdk/upstream/emscripten/cache/sysroot/include/emscripten.h"
#include "../src/tide_harmonics.hpp"
#include <cstdlib> // For malloc and free
#include <iostream>
#include <vector>

void print_vec(std::vector<double> &vec) {
  for (auto &v : vec) {
    std::cout << v << " ";
  }
  std::cout << " \n";
}

extern "C" {

EMSCRIPTEN_KEEPALIVE auto _malloc_(int32_t n) -> void * { return malloc(n); }

EMSCRIPTEN_KEEPALIVE auto readDataUnits(char *data, long int data_size,
                                        double units, char sep, int col_t,
                                        int col_h, double **times,
                                        double **heights,
                                        char **datetime_str) -> long int {
  data[data_size - 1] = '\0';
  std::vector<double> t;
  std::vector<double> h;
  std::cout << "sep : " << sep << "\n";

  std::string data_str(data);
  std::string datetime;
  read_csv_string_units(data_str, sep, col_t, col_h, units, t, h, datetime);

  *heights = (double *)malloc(h.size() * sizeof(double));
  *times = (double *)malloc(t.size() * sizeof(double));
  *datetime_str = (char *)malloc(sizeof(char) * (datetime.size() + 1));

  if (*times == nullptr || *datetime_str == nullptr || *heights == nullptr) {
    std::cout << "alloc error \n";
    exit(1);
  }

  std::copy(t.begin(), t.end(), *times);
  std::copy(h.begin(), h.end(), *heights);
  std::copy(datetime.begin(), datetime.end(), *datetime_str);
  *(*datetime_str + datetime.size()) = '\0';

  return (long int)t.size();
}

EMSCRIPTEN_KEEPALIVE auto readData(char *data, long int data_size,
                                   const char *format, char sep, int col_t,
                                   int col_h, double **times, double **heights,
                                   char **datetime_str) -> long int {
  data[data_size - 1] = '\0';
  std::vector<double> t;
  std::vector<double> h;
  std::cout << "sep : " << sep << "\n";
  std::cout << "format : " << format << "\n";

  std::string data_str(data);
  std::string datetime;
  read_csv_string(data_str, format, sep, col_t, col_h, t, h, datetime);

  *heights = (double *)malloc(h.size() * sizeof(double));
  *times = (double *)malloc(t.size() * sizeof(double));
  *datetime_str = (char *)malloc(sizeof(char) * (datetime.size() + 1));

  if (*times == nullptr || *datetime_str == nullptr || *heights == nullptr) {
    std::cout << "alloc error \n";
    exit(1);
  }

  std::copy(t.begin(), t.end(), *times);
  std::copy(h.begin(), h.end(), *heights);
  std::copy(datetime.begin(), datetime.end(), *datetime_str);
  *(*datetime_str + datetime.size()) = '\0';

  return (long int)t.size();
}

EMSCRIPTEN_KEEPALIVE void
sumHarmonics(const double *times_in, int n_t, const double *pulsations_in,
             const double *phases_in, const double *amplitudes_in,
             double mean_h, int n_puls, double *height_out) {

  std::vector<double> t(times_in, times_in + n_t);
  Components<double> components;
  components.set_pulsations(pulsations_in, n_puls);
  components.set_amplitudes(amplitudes_in, n_puls);
  components.set_phases(phases_in, n_puls);

  std::vector<double> h = components.harmonic_series(t);

  for (auto &v : h) {
    v += mean_h;
  }

  std::copy(h.begin(), h.end(), height_out);
}

EMSCRIPTEN_KEEPALIVE void getHarmonics(const double *times_in,
                                       const double *height_in, int n_t,
                                       const double *pulsations_in,
                                       double mean_h, double *phases_out,
                                       double *amplitudes_out, int n_puls) {

  std::vector<double> t(times_in, times_in + n_t);
  std::vector<double> h(height_in, height_in + n_t);

  Components<double> components;
  components.set_pulsations(pulsations_in, n_puls);

  for (auto &v : h) {
    v -= mean_h;
  }
  components.harmonic_analysis(t, h);

  std::copy(components.phases.begin(), components.phases.end(), phases_out);
  std::copy(components.amplitudes.begin(), components.amplitudes.end(),
            amplitudes_out);
}
}
