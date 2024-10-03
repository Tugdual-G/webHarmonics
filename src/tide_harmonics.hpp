#ifndef TIDE_HARMONICS_H_
#define TIDE_HARMONICS_H_

#include "eigen-3.4.0/Eigen/Dense"
#include <map>
#include <string>
#include <vector>

template <typename T> class Components {
public:
  std::vector<T> pulsations;
  std::vector<T> amplitudes;
  std::vector<T> phases;

  auto harmonic_series(const std::vector<T> &t) -> std::vector<T>;

  void harmonic_analysis(const std::vector<T> &times,
                         const std::vector<T> &heights);

  void set_amplitudes(const std::vector<T> &amplitudes_in);
  void set_phases(const std::vector<T> &phases_in);
  void set_pulsations(const std::vector<T> &pulsations_in);

  auto error_inf(const std::vector<T> &t, const std::vector<T> &h) -> T;
  auto error_mean(const std::vector<T> &t, const std::vector<T> &h) -> T;
  auto error_2(const std::vector<T> &t, const std::vector<T> &h) -> T;

  Components(const std::vector<T> &pulsations) : pulsations(pulsations) {};

  Components();

private:
  auto build_lsq_matrix(const std::vector<T> &t)
      -> Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic>;

  auto extract_amplitudes(Eigen::Matrix<T, Eigen::Dynamic, 1> &X);

  auto extract_phases(Eigen::Matrix<T, Eigen::Dynamic, 1> &X);
};

namespace Tide {

void get_constituants_const(std::vector<std::string> &names,
                            std::vector<double> &pulsation);

template <typename T> auto mean(std::vector<T> &x) -> T;

const std::map<std::string, double> TIDAL_CONST{
    {"M2", 28.9841042}, // Principal lunar semidiurnal degrees/hour
    {"S2", 30.0000000}, // Principal solar semidiurnal
    {"N2", 28.4397295}, // Larger lunar elliptic semidiurnal
    {"K1", 15.0410686}, // Lunar diurnal
    {"O1", 13.9430356}, // Lunar diurnal
    {"P1", 14.9589314}, // Solar diurnal
    {"Q1", 13.3986609}, // Larger lunar elliptic diurnal
    {"K2", 30.0821373}, // Lunisolar semidiurnal
    {"L2", 29.5284789}, // Smaller lunar elliptic semidiurnal
    {"T2", 29.9589333}, // Smaller solar semidiurnal
    {"Mf", 1.0980331},  // Lunar fortnightly
    {"Mm", 0.5443747},  // Lunar monthly
    {"Ssa", 0.0821373}, // Solar semiannual
    {"Sa", 0.0410686},  // Solar annual
};

} // namespace Tide

void read_csv_string(const std::string &csv, const char *format, char sep,
                     int col_t, int col_h, std::vector<double> &time,
                     std::vector<double> &value, std::string &datetime_str);

void read_csv_string_units(const std::string &csv, char sep, int col_t,
                           int col_h, double units, std::vector<double> &time,
                           std::vector<double> &value,
                           std::string &datetime_str);

void read_csv_data(std::string fname, std::vector<double> &time,
                   std::vector<double> &value);

#endif // TIDE_HARMONICS_H_
