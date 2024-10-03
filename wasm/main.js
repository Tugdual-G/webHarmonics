function typeset(code) {
  MathJax.startup.promise = MathJax.startup.promise
    .then(() => MathJax.typesetPromise(code()))
    .catch((err) => console.log('Typeset failed: ' + err.message));
  return MathJax.startup.promise;
}

function toScient(x){
    let str = x.toExponential(3).replace(/e\+?/, ' \\cdot 10^{');
    str += "}";
    return str;
}

let txtArray;
let t = null;
let h = null;
let h_mean = 0.0;
let epoch = null;

let pulsations = null;
let amplitudes = null;
let phases = null;

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

let available_pulsations = {};
{
    const comp_names = [];
    const comp_pul = [];
    const compute_comp = [];
    const comp_period = [];
    COMPONENT_SPEEDS.forEach((value, key) => {
        comp_names.push(key);
        comp_pul.push(Math.PI * value / 180.0);
        compute_comp.push(true);
        comp_period.push(360.0 / value);
    });
    for (let i = 1; i < 6; ++i){
        compute_comp[compute_comp.length-i] = false;
    }
    available_pulsations.names = comp_names;
    available_pulsations.pulsations = comp_pul;
    available_pulsations.compute = compute_comp;
    available_pulsations.period = comp_period;
    available_pulsations.comp_puls = [];
    available_pulsations.compStr = "";
}

function mean(arr){
    let mean = 0.0;
    arr.forEach((x)=> mean += x);
    return mean / arr.length;
}

function getPulsations(){
    available_pulsations.comp_puls = [];
    for (let i = 0; i<available_pulsations.names.length; ++i){
        if ( available_pulsations.compute[i] == true ){
            available_pulsations.comp_puls.push(available_pulsations.pulsations[i])
        }
    }
}

function fetchComponentsSelection(){
    for (let i=0; i < available_pulsations.names.length; ++i){
        available_pulsations.compute[i] = document.getElementById(`component${i}`).checked;
    }
}

function initComponentsTable(){
    let htmlList = "";
    let i_computed = 0;
    for (let i = 0; i< available_pulsations.names.length; ++i){
        htmlList += "<tr>\n"
        htmlList += `<td>  ${available_pulsations.names[i]}  </td>\n`;
        htmlList += `<td>  ${available_pulsations.pulsations[i].toExponential(3)}  </td>\n`;
        htmlList += `<td>  ${available_pulsations.period[i].toExponential(3)}  </td>\n`;
        htmlList += `<td>---</td>\n`;
        htmlList += `<td>---</td>\n`;
        if (available_pulsations.compute[i]){
            htmlList += `<td>
                    <input type="checkbox" id="component${i}" name="scales" checked />
                </td>\n`;
            ++i_computed;
        }else {
            htmlList += `<td>
                    <input type="checkbox" id="component${i}" name="scales" />
                </td>\n`;
        }
        htmlList += "</tr>\n"
    }
    document.getElementById('components').innerHTML = htmlList;
}

function fillComponentsTable(ampls, phases){
    let htmlList = "";
    let i_computed = 0;
    for (let i = 0; i< available_pulsations.names.length; ++i){
        htmlList += "<tr>\n"
        htmlList += `<td>  ${available_pulsations.names[i]}  </td>\n`;
        htmlList += `<td>  ${available_pulsations.pulsations[i].toExponential(3)}  </td>\n`;
        htmlList += `<td>  ${available_pulsations.period[i].toExponential(3)}  </td>\n`;
        if (available_pulsations.compute[i]){
            htmlList += `<td>  ${ampls[i_computed].toExponential(3)}  </td>\n`;
            htmlList += `<td>  ${phases[i_computed].toExponential(3)}  </td>\n`;
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
    available_pulsations.compStr = "#";
    available_pulsations.compStr += "t=0 reference datetime ";
    available_pulsations.compStr += epoch + "\n";
    available_pulsations.compStr += "#name pulsation(rad/h) amplitude(m) phase(rad)\n";
    let i_computed = 0;
    for (let i = 0; i< available_pulsations.names.length; ++i){
        if (available_pulsations.compute[i]){
            available_pulsations.compStr += `${available_pulsations.names[i]}`;
            available_pulsations.compStr += ` ${available_pulsations.pulsations[i].toExponential(8)}`;
            available_pulsations.compStr += ` ${ampls[i_computed].toExponential(8)}`;
            available_pulsations.compStr += ` ${phases[i_computed].toExponential(8)}\n`;
            ++i_computed;
        }
    }
}

function getRange(x){

    let i_min = 0;
    let i_max = 0;

    const txt_min = document.getElementById("t_min").value;
    const txt_max = document.getElementById("t_max").value;
    let t_min = parseFloat(txt_min);
    let t_max = parseFloat(txt_max);

    if(!isNaN(t_min)) {
        while (i_min < x.length && x[i_min] < t_min){
            ++i_min;
        }
    }else{
        i_min = 0;
    }

    if (!isNaN(t_max)){
        i_max = i_min;
        while (i_max < x.length && x[i_max] < t_max ){
            ++i_max;
        }
    }else{
        i_max = x.length;
    }

    if (i_min == i_max){
        i_min = 0;
        i_max = x.length;
    }

    return [i_min, i_max];
}

function cStringLength(cString){
    let end = 0;
    while (cString.getUint8(end) !== 0 && end < 500) {
        end++
    }
    return end;
}

function stringtoChar(str){
    var enc = new TextEncoder(); // always utf-8
    return enc.encode(str);
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
        const epoch_ptr = createPointerArray(1);

        const sep = document.getElementById("separator").value;
        const col_t = document.getElementById("col_t").value;
        const col_h = document.getElementById("col_h").value;

        // "%d/%m/%Y %H:%M:%S"
        let user_format = document.getElementById("format").value;
        let n_pts = 0;
        if (user_format.includes("%") || isNaN(parseFloat(user_format))){
            if (isNaN(parseFloat(user_format))){
                user_format = "%d/%m/%Y %H:%M:%S";
            }
            const format = createCharArray(stringtoChar(user_format));
            n_pts = Module._readData(txtArray.byteOffset, txtArray.byteLength, format.byteOffset,
                                        sep.charCodeAt(0), col_t, col_h, t_ptr.byteOffset, h_ptr.byteOffset,
                                        epoch_ptr.byteOffset);

        }else {
            const units = parseFloat(user_format);
            console.log(units);
            n_pts = Module._readDataUnits(txtArray.byteOffset, txtArray.byteLength, units,
                                        sep.charCodeAt(0), col_t, col_h, t_ptr.byteOffset, h_ptr.byteOffset,
                                        epoch_ptr.byteOffset);
        }


        t = new Float64Array(memory.buffer, t_ptr[0], n_pts);
        h = new Float64Array(memory.buffer, h_ptr[0], n_pts);

        const epochStrLen = cStringLength(new DataView(memory.buffer, epoch_ptr));
        const epoch_array = new Uint8Array(memory.buffer, epoch_ptr[0], epochStrLen);
        epoch = new TextDecoder().decode(epoch_array);

        h_mean = mean(h);


        const meanDataElement = document.getElementById('mean_data');
        meanDataElement.innerHTML = `\\( \\overline{h_{data}} = ${toScient(h_mean)} ~ m \\)`;
        typeset(() => {
        return [meanDataElement];
        });

        const refDate = document.getElementById('ref_date');
        refDate.innerHTML = `dataset reference datetime : ${epoch}`;

        Module._free(t_ptr.byteOffset);
        Module._free(h_ptr.byteOffset);
        Module._free(epoch_ptr.byteOffset);
        Module._free(epoch_array.byteOffset);

    }

    async function analyse(times, heights){
        fetchComponentsSelection();
        getPulsations();

        if (amplitudes != null){
            Module._free(amplitudes.byteOffset);
            Module._free(pulsations.byteOffset);
            Module._free(phases.byteOffset);
        }

        pulsations = createF64Array(available_pulsations.comp_puls.length);
        pulsations.set(available_pulsations.comp_puls);

        amplitudes = createF64Array(available_pulsations.comp_puls.length);

        phases = createF64Array(available_pulsations.comp_puls.length);

        Module._getHarmonics(times.byteOffset, heights.byteOffset, times.length, pulsations.byteOffset,
                            h_mean, phases.byteOffset, amplitudes.byteOffset, pulsations.length);

        if (available_pulsations.compute[0]){
            amplitudes[0] = h_mean + amplitudes[0]*Math.cos(phases[0]);
            phases[0] = 0.0;
        }
        fillComponentsTable(amplitudes, phases);

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

        let mean_plot = h_mean;
        if (available_pulsations.compute[0]){
            mean_plot = 0.0;
        }
        Module._sumHarmonics(t_fit.byteOffset, t_fit.length, pulsations.byteOffset, phases.byteOffset,
                             amplitudes.byteOffset, mean_plot, phases.length, h_fit.byteOffset);


        const plot = [];

        const range = getRange(t_fit);
        plot.push({
            x: t,
            y: h,
            mode: 'lines+markers',
            name: 'data',
            line: {
                color: 'rgb(107, 107, 107)',
                width: 0.5,
            }
        });

        plot.push({
            x: t_fit,
            y: h_fit,
            mode: 'lines',
            name: 'fit',
            line: {
                color: 'rgb(0, 20, 117)',
                width: 1.0,
            }
        });


        const min = h_fit.reduce(
            (accumulator, currentValue) => Math.min(accumulator, currentValue), h_fit[0]);
        const max = h_fit.reduce(
            (accumulator, currentValue) => Math.max(accumulator, currentValue), h_fit[0]);

        var layout = {
            // title: 'Least square fitting',
            xaxis: {title: 't (h)'},
            yaxis: {title: 'h (m)'},
            legend: {"itemsizing": "constant", "itemwidth": 50},
            shapes: [
                {
                    name: 'Analysis',
                    type: 'rect',
                    xref: 'x',
                    yref: 'y',
                    x0: t_fit[range[0]],
                    y0: min - (max - min) * 0.1,
                    x1: t_fit[range[1]],
                    y1: max + (max - min) * 0.1,
                    opacity: 0.1,
                    fillcolor: 'rgb(110, 26, 74)',
                }],
                annotations: [
                    {
                    x: (t_fit[range[0]] + t_fit[range[1]])/2.0,
                    y: max + (max - min) * 0.15,
                    xref: 'x',
                    yref: 'y',
                    text: 'Analysis range',
                    font: {
                        family: 'sans serif',
                        size: 18,
                        color: 'rgb(110, 26, 74)'
                    },
                    color: "red",
                    showarrow: false,
                    // arrowhead: 7,
                    // ax: 0,
                    // ay: -40
                    }
                ],
        };


        Plotly.newPlot( "graph", plot, layout);


        Module._free(t_fit.byteOffset);
        Module._free(h_fit.byteOffset);

    }


    initComponentsTable();

    let file;
    const fileInput = document.getElementById('inselec');
    // In case the file is cached by the navigation
    if (typeof fileInput.files[0] == "undefined"){
        document.getElementById("t_min").value = "none";
        document.getElementById("t_max").value = "2000";
        document.getElementById("separator").value = ";";
        document.getElementById("col_t").value = 0;
        document.getElementById("col_h").value = 1;
        // "%d/%m/%Y %H:%M:%S"
        document.getElementById("format").value = "%d/%m/%Y %H:%M:%S";
        file = await fetch("test_data.txt");
        txtArray = createCharArray(await file.bytes());
    } else {
        file = fileInput.files[0];
        txtArray = createCharArray(await file.bytes());
    }



    readData();
    const range = getRange(t);
    analyse(t.subarray(range[0], range[1]), h.subarray(range[0], range[1]));
    plotHarmonics();

    const compBtn = document.getElementById('compBtn');
    compBtn.addEventListener("click", ()=>{
        const range = getRange(t);
        analyse(t.subarray(range[0], range[1]), h.subarray(range[0], range[1]));
        plotHarmonics();
    });

    const reloadBtn = document.getElementById('reload');
    reloadBtn.addEventListener("click", ()=>{
        readData();
        const range = getRange(t);
        analyse(t.subarray(range[0], range[1]), h.subarray(range[0], range[1]));
        plotHarmonics();
    });

    fileInput.onchange = async (e) => {
        file = e.target.files[0];
        Module._free(txtArray.byteOffset);
        txtArray = createCharArray(await file.bytes());
    }



    let textFile = null;
    document.getElementById('textFile').addEventListener("click", ()=>{
        fillComponentsString(amplitudes, phases);
        const comptxt = new Blob([available_pulsations.compStr], {type: 'text/plain'});
        if (textFile !== null) {
            window.URL.revokeObjectURL(textFile);
        }
        textFile = window.URL.createObjectURL(comptxt);
        window.open(textFile, '_blank').focus();
    });


}

