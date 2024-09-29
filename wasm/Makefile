##
# Project Title
#
# @file
# @version 0.1
# Define variables
#
TARGET = harmonics
SRCS = harmonics.cpp ../src/tide_harmonics.cpp
EXPORTED_FUNCTIONS = ['_malloc','_free']
EXPORTED_RUNTIME_METHODS = ['ccall', 'cwrap', 'wasmMemory']

OUTPUT_FORMAT = -o $(TARGET).js

EMCC = em++

CXXFLAGS =  -s EXPORTED_FUNCTIONS="$(EXPORTED_FUNCTIONS)" \
            -s EXPORTED_RUNTIME_METHODS="$(EXPORTED_RUNTIME_METHODS)" \
            -std=c++20 \
			-O3

all: $(TARGET).wasm

$(TARGET).wasm: $(SRCS)
	$(EMCC) $(SRCS) $(OUTPUT_FORMAT) $(CXXFLAGS)

clean:
	rm -f $(TARGET).wasm $(TARGET).js
# end
