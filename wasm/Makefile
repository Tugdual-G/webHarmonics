##
# Project Title
#
# @file
# @version 0.1
# Define variables
#
TARGET = harmonics
EXPORTED_FUNCTIONS = ['_malloc','_free']
EXPORTED_RUNTIME_METHODS = ['ccall', 'cwrap', 'wasmMemory']

OUTPUT_FORMAT = $(TARGET).js

EMCC = em++

CXXFLAGS =  -s EXPORTED_FUNCTIONS="$(EXPORTED_FUNCTIONS)" \
            -s EXPORTED_RUNTIME_METHODS="$(EXPORTED_RUNTIME_METHODS)" \
            -std=c++20 \
			-O3

all: $(TARGET).wasm tide_harmonics.o

$(TARGET).wasm: harmonics.cpp tide_harmonics.o
	$(EMCC) $^ -o $(OUTPUT_FORMAT) $(CXXFLAGS)

tide_harmonics.o: ../src/tide_harmonics.cpp
	$(EMCC) -std=c++20 -c $^

clean:
	rm -f $(TARGET).wasm $(TARGET).js *.o
# end
