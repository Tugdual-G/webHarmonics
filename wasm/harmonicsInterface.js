
export class Components {
    constructor() {
        this.pulsations = null;
        this.amplitudes = null;
        this.phases = null;
    }

    setPulsation(puls){
        if (this.pulsations != null){
            Module._free(this.pulsations.byteOffset);
        }
        this.pulsations = createF64Array(puls.length);
        this.pulsations.set(puls);
    }

    analyze(times, heights, mean){

        if (this.amplitudes != null){
            Module._free(this.amplitudes.byteOffset);
        }

        if (this.phases != null){
            Module._free(this.phases.byteOffset);
        }

        this.amplitudes = createF64Array(this.pulsations.length);
        this.phases = createF64Array(this.pulsations.length);

        Module._getHarmonics(times.byteOffset, heights.byteOffset, times.length,
                                this.pulsations.byteOffset, mean,
                                this.phases.byteOffset, this.amplitudes.byteOffset,
                                this.pulsations.length);
    }

    sumHarmonics(times, heights, mean){
        Module._sumHarmonics(times.byteOffset, times.length, this.pulsations.byteOffset,
                             this.phases.byteOffset, this.amplitudes.byteOffset,
                             mean, this.phases.length, heights.byteOffset);

    }

    errorInf(times, heights, mean){
        return Module._errorInf(times.byteOffset, heights.byteOffset, heights.length,
                        this.pulsations.byteOffset, this.phases.byteOffset,
                        this.amplitudes.byteOffset, this.pulsations.length,
                        mean);
    }

    errorMean(times, heights, mean){
        return Module._errorMean(times.byteOffset, heights.byteOffset, heights.length,
                        this.pulsations.byteOffset, this.phases.byteOffset,
                        this.amplitudes.byteOffset, this.pulsations.length,
                        mean);
    }

    free(){
        if (this.amplitudes != null){
            Module._free(this.amplitudes.byteOffset);
        }
        if (this.phases != null){
            Module._free(this.phases.byteOffset);
        }
        if (this.pulsations != null){
            Module._free(this.pulsations.byteOffset);
        }
    }
}

export class Data {
    constructor(){
        this.t = null;
        this.h = null;
        this.epoch = null;
        this.txt = null;
        this.mean = 0.0;
        this.fname = "";
    }

    subData(range){
        const sub = new Data();
        sub.t = this.t.subarray(range[0], range[1]);
        sub.h = this.h.subarray(range[0], range[1]);
        sub.epoch = this.epoch;
        sub.mean = this.mean;
        return sub;
    }

    readData(sep, col_t, col_h, userFormat){

        // if (this.t != null){
        //     Module._free(this.t.byteOffset);
        // }
        // if (this.h != null){
        //     Module._free(this.h.byteOffset);
        // }

        const t_ptr = createPointerArray(1);
        const h_ptr = createPointerArray(1);
        const epoch_ptr = createPointerArray(1);

        // "%d/%m/%Y %H:%M:%S"
        let n_pts = 0;
        if (userFormat.includes("%") || isNaN(parseFloat(userFormat))){
            if (isNaN(parseFloat(userFormat))){
                userFormat = "%d/%m/%Y %H:%M:%S";
            }
            const format = stringToChars(userFormat);
            n_pts = Module._readData(this.txt.byteOffset, this.txt.byteLength, format.byteOffset,
                                        sep.charCodeAt(0), col_t, col_h, t_ptr.byteOffset, h_ptr.byteOffset,
                                        epoch_ptr.byteOffset);

        }else {
            const units = parseFloat(userFormat);
            console.log(units);
            n_pts = Module._readDataUnits(this.txt.byteOffset, this.txt.byteLength, units,
                                        sep.charCodeAt(0), col_t, col_h, t_ptr.byteOffset, h_ptr.byteOffset,
                                        epoch_ptr.byteOffset);
        }


        const memory = Module.wasmMemory;
        this.t = new Float64Array(memory.buffer, t_ptr[0], n_pts);
        this.h = new Float64Array(memory.buffer, h_ptr[0], n_pts);

        const epochStrLen = cStringLength(new DataView(memory.buffer, epoch_ptr));
        const epoch_array = new Uint8Array(memory.buffer, epoch_ptr[0], epochStrLen);
        this.epoch = new TextDecoder().decode(epoch_array);

        this.mean = mean(this.h);

        Module._free(t_ptr.byteOffset);
        Module._free(h_ptr.byteOffset);
        Module._free(epoch_ptr.byteOffset);
        Module._free(epoch_array.byteOffset);

    }
}

export function createF64Array(n){
    const memory = Module.wasmMemory;
    const ptr = Module._malloc(n * 8);
    return new Float64Array(memory.buffer, ptr, n);
}


export function createCharArray(txtBytes){
    const memory = Module.wasmMemory;
    const txtPtr = Module._malloc(txtBytes.byteLength + 1);
    const arr = new Uint8Array(memory.buffer, txtPtr, txtBytes.length + 1);
    arr.set(txtBytes);
    arr[arr.length - 1] = '\0';
    return arr;

}

export function createPointerArray(n){
    const memory = Module.wasmMemory;
    const ptr = Module._malloc(n * 4);
    const arr = new Uint32Array(memory.buffer, ptr, n);
    return arr;
}

export function cStringLength(cString){
    let end = 0;
    while (cString.getUint8(end) !== 0 && end < 500) {
        end++
    }
    return end;
}

export function stringToChars(str){
    var enc = new TextEncoder(); // always utf-8
    return createCharArray(enc.encode(str));
}

function mean(arr){
    let mean = 0.0;
    arr.forEach((x)=> mean += x);
    return mean / arr.length;
}
