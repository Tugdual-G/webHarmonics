
Module.onRuntimeInitialized = async () => {

    const pulsations0 = [
        0.262516,    //
        0.525032,    //
        0.515369,    //
        0.505868,    //
        0.0191643,   //
        0.00950113,  //
        0.496367,    //
        0.243352,    //
        0.261083,    //
        0.233851,    //
        0.523599,    //
        0.000716782, //
        0.00143357,  //
        0.522882,    //
    ];

    const memory = Module.wasmMemory;

    function createF64Array(n){
        const ptr = Module._malloc(n * 8);
        return new Float64Array(memory.buffer, ptr, n);
    }


    function createCharArray(txtBytes){
        const txtPtr = Module._malloc(txtBytes.byteLength + 1);
        const arr = new Uint8Array(memory.buffer, txtPtr, txtBytes.length + 4);
        arr.set(txtBytes);
        arr[arr.length - 1] = '\0';
        return arr;

    }

    function createPointerArray(n){
        const ptr = Module._malloc(n * 4);
        const arr = new Uint32Array(memory.buffer, ptr, n);
        return arr;
    }

    function testSum(){
        let pulsations = createF64Array(pulsations0.length);
        pulsations.set(pulsations0);

        let amplitudes = createF64Array(amplitudes0.length);

        let phases = createF64Array(phases0.length);

        const n_t = 5000;
        let h = createF64Array(n_t);
        let t = createF64Array(n_t);
        for (let i = 0; i < t.length; ++i){
            t[i] = i * 0.5;
        }

        Module._sumHarmonics(t.byteOffset, n_t, pulsations.byteOffset, phases.byteOffset,
                            amplitudes.byteOffset, 0.0, phases.length, h.byteOffset);


        var trace0 = {
            x: t,
            y: h,
            mode: 'lines'
        };


        Plotly.newPlot( "graph", [trace0]);

    }

    const resp = await fetch("95_2024.txt");
    if (!resp.ok) {
      throw new Error(`Response status: ${resp.status}`);
    }
    const txtArray = createCharArray(await resp.bytes());

    const t_ptr = createPointerArray(1);
    const h_ptr = createPointerArray(1);

    const n_pts = Module._readData(txtArray.byteOffset, txtArray.byteLength,
                     t_ptr.byteOffset, h_ptr.byteOffset);
    console.log(n_pts);
    console.log(t_ptr);
    console.log(h_ptr);
    const t = new Float64Array(memory.buffer, t_ptr[0], n_pts);
    const h = new Float64Array(memory.buffer, h_ptr[0], n_pts);

    let h_mean = 0.0;
    h.forEach((x)=> h_mean += x);
    h_mean /= h.length;
    console.log(h_mean);
    h.map((x)=> x-h_mean);



    let pulsations = createF64Array(pulsations0.length);
    pulsations.set(pulsations0);

    let amplitudes = createF64Array(pulsations0.length);

    let phases = createF64Array(pulsations0.length);

    Module._getHarmonics(t.byteOffset, h.byteOffset, t.length, pulsations.byteOffset,
                         h_mean, phases.byteOffset, amplitudes.byteOffset, pulsations.length);


    const t_fit = createF64Array(t.length * 4);
    const h_fit = createF64Array(t.length * 4);
    {
        const dt = (t[t.length - 1] - t[0]) / t_fit.length ;
        for (let i = 0; i<t_fit.length; ++i){
            t_fit[i] = i * dt;
        }
    }

    Module._sumHarmonics(t_fit.byteOffset, t_fit.length, pulsations.byteOffset, phases.byteOffset,
                        amplitudes.byteOffset, h_mean, phases.length, h_fit.byteOffset);

    var trace0 = {
        x: t,
        y: h,
        mode: 'lines+markers',
        name: 'data',
    };

    var trace1 = {
        x: t_fit,
        y: h_fit,
        mode: 'lines',
        name: 'fit',
    };

    var layout = {
        title: 'Harmonic analysis',
        xaxis: {title: 't (h)'},
        yaxis: {title: 'h (m)'},
    };

    Plotly.newPlot( "graph", [trace0, trace1], layout);

}
