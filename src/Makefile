##
##
CC = clang++
CFLAGS = -Wall -Wextra -O2 -std=c++23 -I. -g

# Targets
all: test plot tide_harmonics.a

test: test.cpp tide_harmonics.a
	$(CC) -I. $(CFLAGS) $^ -o $@

plot: plot.cpp tide_harmonics.a
	$(CC) $(CFLAGS) $^ -o $@

tide_harmonics.a: tide_harmonics.o
	ar rvs $@ $^

tide_harmonics.o: tide_harmonics.cpp
	$(CC) $(CFLAGS) -c $^

clean:
	rm -f test main *.o *.so

.PHONY: clean

# end
