#ifndef TIDE_HARMONICS_H_
#define TIDE_HARMONICS_H_

#include "eigen-3.4.0/Eigen/Dense"
#include <map>
#include <string>
#include <vector>

namespace Tide {
void read_csv_data(std::string fname, std::vector<double> &time,
                   std::vector<double> &value);

void get_constituants_const(std::vector<std::string> &names,
                            std::vector<double> &pulsation);

auto build_lsq_matrix(const std::vector<double> &t,
                      const std::vector<double> &pulsations)
    -> Eigen::Matrix<double, Eigen::Dynamic, Eigen::Dynamic>;

auto get_amplitudes(Eigen::Matrix<double, Eigen::Dynamic, 1> &cs_ampl)
    -> std::vector<double>;

auto get_phases(Eigen::Matrix<double, Eigen::Dynamic, 1> &cs_ampl)
    -> std::vector<double>;

auto mean(std::vector<double> &x) -> double;

auto harmonic_series(
    const std::vector<double> &t, const std::vector<double> &pulsation,
    const std::vector<double> &phase,
    const std::vector<double> &amplitude) -> std::vector<double>;

void harmonic_analysis(const std::vector<double> &times,
                       const std::vector<double> &heights,
                       const std::vector<double> &pulsations,
                       double mean_height, std::vector<double> &phases,
                       std::vector<double> &amplitudes);

void read_csv_string(std::string &csv, std::vector<double> &time,
                     std::vector<double> &value);

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
#endif // TIDE_HARMONICS_H_
