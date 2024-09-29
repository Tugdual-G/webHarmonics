#!/usr/bin/env python3
import pandas as pd
import numpy as np
from scipy.optimize import lsq_linear
import matplotlib.pyplot as plt

tidal_constituents = {
    "M2": 28.9841042,  # Principal lunar semidiurnal degrees/hour
    "S2": 30.0000000,  # Principal solar semidiurnal
    "N2": 28.4397295,  # Larger lunar elliptic semidiurnal
    "K1": 15.0410686,  # Lunar diurnal
    "O1": 13.9430356,  # Lunar diurnal
    "P1": 14.9589314,  # Solar diurnal
    "Q1": 13.3986609,  # Larger lunar elliptic diurnal
    "K2": 30.0821373,  # Lunisolar semidiurnal
    "L2": 29.5284789,  # Smaller lunar elliptic semidiurnal
    "T2": 29.9589333,  # Smaller solar semidiurnal
    "Mf": 1.0980331,  # Lunar fortnightly
    "Mm": 0.5443747,  # Lunar monthly
    "Ssa": 0.0821373,  # Solar semiannual
    "Sa": 0.0410686,  # Solar annual
}


def create_lsq_matrix(t, pulsation):
    A = np.zeros((len(t), len(pulsation) * 2), dtype=np.float64)
    A[:, ::2] = np.cos(pulsation[np.newaxis, :] * t[:, np.newaxis])
    A[:, 1::2] = np.sin(pulsation[np.newaxis, :] * t[:, np.newaxis])
    return A


def get_amplitude(x):
    amplitude = np.zeros(len(x) // 2)
    for i in range(len(x) // 2):
        amplitude[i] = np.sqrt(x[i * 2] ** 2 + x[i * 2 + 1] ** 2)
    return amplitude


def get_phase(x):
    phase = np.zeros(len(x) // 2)
    for i in range(len(x) // 2):
        phase[i] = np.arctan2(x[i * 2], x[i * 2 + 1]) - np.pi * 0.5
    return phase


def tide_serie(t, pulsation, phase, amplitude):
    h = np.zeros_like(t, dtype=np.float64)
    for i in range(len(t)):
        h[i] = np.sum(amplitude * np.cos(pulsation * t[i] + phase))
    return h


col_names = ["date", "val", "source"]
data = pd.read_csv("95_2024.txt", header=0, skiprows=13, sep=";", names=col_names)
data["date"] = pd.to_datetime(data["date"], format="%d/%m/%Y %H:%M:%S")
data["val"] -= data["val"].mean()
data["date"] = (data["date"] - data["date"].iloc[0]) // pd.Timedelta("1h")
h = data["val"].to_numpy()
t = data["date"].to_numpy()

pulsation = np.array([np.pi * a / 180.0 for _, a in tidal_constituents.items()])
constituants_names = np.array([name for name, _ in tidal_constituents.items()])

A = create_lsq_matrix(t, pulsation)
x = lsq_linear(A, h)["x"]
data.plot(x="date", y="val")
ax = plt.gca()
t_plot = np.linspace(t[0], t[-1], 2 * len(t))
# A = create_lsq_matrix(t_plot, pulsation)
# ax.plot(t_plot, A @ x, "r")
amplitude = get_amplitude(x)
phase = get_phase(x)
ax.plot(t_plot, tide_serie(t_plot, pulsation, phase, amplitude), "r")
ax.set_xlim((1000, 1500))

print(f"condition number : {np.linalg.cond(A.T @ A)}")
plt.show()
