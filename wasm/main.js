const COMPONENT_SPEEDS = new Map();
COMPONENT_SPEEDS.set("M2", 28.9841042);// Principal lunar semidiurnal degrees/hour
COMPONENT_SPEEDS.set("S2", 30.0000000);// Principal solar semidiurnal
COMPONENT_SPEEDS.set("N2", 28.4397295);// Larger lunar elliptic semidiurnal
COMPONENT_SPEEDS.set("K1", 15.0410686);// Lunar diurnal
COMPONENT_SPEEDS.set("O1", 13.9430356); // Lunar diurnal
COMPONENT_SPEEDS.set("P1", 14.9589314); // Solar diurnal
COMPONENT_SPEEDS.set("Q1", 13.3986609); // Larger lunar elliptic diurnal
COMPONENT_SPEEDS.set("K2", 30.0821373); // Lunisolar semidiurnal
COMPONENT_SPEEDS.set("L2", 29.5284789); // Smaller lunar elliptic semidiurnal
COMPONENT_SPEEDS.set("T2", 29.9589333); // Smaller solar semidiurnal
COMPONENT_SPEEDS.set("Mf", 1.0980331); // Lunar fortnightly
COMPONENT_SPEEDS.set("Mm", 0.5443747);  // Lunar monthly
COMPONENT_SPEEDS.set("Ssa", 0.0821373); // Solar semiannual
COMPONENT_SPEEDS.set("Sa", 0.0410686);  // Solar annual

const comp_names = [];
const pulsations0 = [];
COMPONENT_SPEEDS.forEach((value, key) => {
    comp_names.push(key);
    pulsations0.push(Math.PI * value / 180.0);
});

Module.onRuntimeInitialized = async () => {


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

    async function analyse(file){

        // const txtArray = createCharArray(await resp.bytes());
        //
        const txtArray = createCharArray(await file.bytes());

        const t_ptr = createPointerArray(1);
        const h_ptr = createPointerArray(1);

        const n_pts = Module._readData(txtArray.byteOffset, txtArray.byteLength,
                        t_ptr.byteOffset, h_ptr.byteOffset);
        const t = new Float64Array(memory.buffer, t_ptr[0], n_pts);
        const h = new Float64Array(memory.buffer, h_ptr[0], n_pts);

        let h_mean = 0.0;
        h.forEach((x)=> h_mean += x);
        h_mean /= h.length;
        h.map((x)=> x-h_mean);



        let pulsations = createF64Array(pulsations0.length);
        pulsations.set(pulsations0);

        let amplitudes = createF64Array(pulsations0.length);

        let phases = createF64Array(pulsations0.length);

        Module._getHarmonics(t.byteOffset, h.byteOffset, t.length, pulsations.byteOffset,
                            h_mean, phases.byteOffset, amplitudes.byteOffset, pulsations.length);


        let htmlList = "";
        for (let i = 0; i< comp_names.length; ++i){
            htmlList += "<tr>\n"
            htmlList += `<td>  ${comp_names[i]}  </td>\n`;
            htmlList += `<td>  ${pulsations0[i]}  </td>\n`;
            htmlList += `<td>  ${amplitudes[i]}  </td>\n`;
            htmlList += `<td>  ${phases[i]}  </td>\n`;
            htmlList += "</tr>\n"
        }
        document.getElementById('components').innerHTML = htmlList;

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
            title: 'Least square fitting',
            xaxis: {title: 't (h)'},
            yaxis: {title: 'h (m)'},
        };

        Plotly.newPlot( "graph", [trace0, trace1], layout);
    }

    const file0 = await fetch("test_data.txt");
    if (!file0.ok) {
    throw new Error(`Response status: ${resp.status}`);
    }
    analyse(file0);

    const input = document.getElementById('inselec');
    input.onchange = e => {
        // getting a hold of the file reference
        const file = e.target.files[0];
        analyse(file);
    }
}
