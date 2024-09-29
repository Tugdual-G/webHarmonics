#!/usr/bin/gnuplot
set xlabel "t (h)"
set ylabel "h (m)"
set xrange [200:300]
plot "data.txt" using 1:2 with line, \
     "data_fit.txt" using 1:2 with lines
