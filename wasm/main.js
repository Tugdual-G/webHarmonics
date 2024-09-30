let txtArray;
let t = null;
let h = null;
let h_mean = 0.0;

let pulsations;
let amplitudes;
let phases;

const COMPONENT_SPEEDS = new Map();
COMPONENT_SPEEDS.set("H0", 0.0);
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

let components = {};
{
    const comp_names = [];
    const comp_pul = [];
    const compute_comp = [];
    COMPONENT_SPEEDS.forEach((value, key) => {
        comp_names.push(key);
        comp_pul.push(Math.PI * value / 180.0);
        compute_comp.push(true);
    });
    compute_comp[0] = false;
    components.names = comp_names;
    components.pulsations = comp_pul;
    components.compute = compute_comp;
    components.comp_puls = [];
    components.compStr = "";
}

function mean(arr){
    let mean = 0.0;
    arr.forEach((x)=> mean += x);
    return mean / arr.length;
}

function getPulsations(){
    components.comp_puls = [];
    for (let i = 0; i<components.names.length; ++i){
        if ( components.compute[i] == true ){
            components.comp_puls.push(components.pulsations[i])
        }
    }
}

function fetchComponentsSelection(){
    for (let i=0; i < components.names.length; ++i){
        components.compute[i] = document.getElementById(`component${i}`).checked;
    }
}

function fillComponentsTable(ampls, phases){
    let htmlList = "";
    let i_computed = 0;
    for (let i = 0; i< components.names.length; ++i){
        htmlList += "<tr>\n"
        htmlList += `<td>  ${components.names[i]}  </td>\n`;
        htmlList += `<td>  ${components.pulsations[i]}  </td>\n`;
        if (components.compute[i]){
            htmlList += `<td>  ${ampls[i_computed]}  </td>\n`;
            htmlList += `<td>  ${phases[i_computed]}  </td>\n`;
            htmlList += `<td>
                    <input type="checkbox" id="component${i}" name="scales" checked />
                </td>\n`;
            ++i_computed;
        }else {
            htmlList += `<td>---</td>\n`;
            htmlList += `<td>---</td>\n`;
            htmlList += `<td>
                    <input type="checkbox" id="component${i}" name="scales" />
                </td>\n`;
        }
        htmlList += "</tr>\n"
    }
    document.getElementById('components').innerHTML = htmlList;
}

function fillComponentsString(ampls, phases){
    components.compStr = "";
    let i_computed = 0;
    for (let i = 0; i< components.names.length; ++i){
        if (components.compute[i]){
            components.compStr += `${components.names[i]}`;
            components.compStr += ` ${components.pulsations[i]}`;
            components.compStr += ` ${ampls[i_computed]}`;
            components.compStr += ` ${phases[i_computed]}\n`;
            ++i_computed;
        }
    }
}

Module.onRuntimeInitialized = async () => {


    const memory = Module.wasmMemory;

    function createF64Array(n){
        const ptr = Module._malloc(n * 8);
        return new Float64Array(memory.buffer, ptr, n);
    }


    function createCharArray(txtBytes){
        const txtPtr = Module._malloc(txtBytes.byteLength + 1);
        const arr = new Uint8Array(memory.buffer, txtPtr, txtBytes.length + 1);
        arr.set(txtBytes);
        arr[arr.length - 1] = '\0';
        return arr;

    }

    function createPointerArray(n){
        const ptr = Module._malloc(n * 4);
        const arr = new Uint32Array(memory.buffer, ptr, n);
        return arr;
    }


    async function readData(){

        if (t != null){
            Module._free(t.byteOffset);
        }
        if (h != null){
            Module._free(h.byteOffset);
        }

        const t_ptr = createPointerArray(1);
        const h_ptr = createPointerArray(1);

        const n_pts = Module._readData(txtArray.byteOffset, txtArray.byteLength,
                        t_ptr.byteOffset, h_ptr.byteOffset);

        t = new Float64Array(memory.buffer, t_ptr[0], n_pts);
        h = new Float64Array(memory.buffer, h_ptr[0], n_pts);

        h_mean = mean(h);
        h.map((x)=> x-h_mean);

        Module._free(t_ptr.byteOffset);
        Module._free(h_ptr.byteOffset);

        const meanDataElement = document.getElementById('mean_data');
        meanDataElement.innerHTML = meanDataElement.innerHTML.replace("---",`${h_mean}`);

    }

    async function analyse(){
        fetchComponentsSelection();
        getPulsations();

        pulsations = createF64Array(components.comp_puls.length);
        pulsations.set(components.comp_puls);

        amplitudes = createF64Array(components.comp_puls.length);

        phases = createF64Array(components.comp_puls.length);

        Module._getHarmonics(t.byteOffset, h.byteOffset, t.length, pulsations.byteOffset,
                            h_mean, phases.byteOffset, amplitudes.byteOffset, pulsations.length);


        fillComponentsTable(amplitudes, phases);
        fillComponentsString(amplitudes, phases);

    }

    function plotHarmonics(){
        const t_fit = createF64Array(t.length * 4);
        const h_fit = createF64Array(t.length * 4);
        {
            const dt = (t[t.length - 1] - t[0]) / t_fit.length ;
            for (let i = 0; i<t_fit.length; ++i){
                t_fit[i] = i * dt + t[0];
            }
        }

        Module._sumHarmonics(t_fit.byteOffset, t_fit.length, pulsations.byteOffset, phases.byteOffset,
                            amplitudes.byteOffset, h_mean, phases.length, h_fit.byteOffset);


        const h_fit_mean = mean(h_fit);
        const meanFitElement = document.getElementById('mean_fit');
        meanFitElement.innerHTML = meanFitElement.innerHTML.replace("---",`${h_fit_mean}`);


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
        Module._free(amplitudes.byteOffset);
        Module._free(pulsations.byteOffset);
        Module._free(phases.byteOffset);

        Module._free(t_fit.byteOffset);
        Module._free(h_fit.byteOffset);

    }

    fillComponentsTable([], []);

    let file = await fetch("test_data.txt");
    if (!file.ok) {
    throw new Error(`Response status: ${resp.status}`);
    }
    txtArray = createCharArray(await file.bytes());

    const compBtn = document.getElementById('compBtn');
    compBtn.addEventListener("click", ()=>{
        analyse();
        plotHarmonics();
    });

    const input = document.getElementById('inselec');
    input.onchange = async (e) => {
        file = e.target.files[0];
        Module._free(txtArray.byteOffset);
        txtArray = createCharArray(await file.bytes());
        readData();
        analyse();
        plotHarmonics();
    }


    readData();
    analyse();
    plotHarmonics();

    let textFile = null;
    document.getElementById('textFile').addEventListener("click", ()=>{
        const comptxt = new Blob([components.compStr], {type: 'text/plain'});
        if (textFile !== null) {
            window.URL.revokeObjectURL(textFile);
        }
        textFile = window.URL.createObjectURL(comptxt);
        window.open(textFile, '_blank').focus();
    });


}

