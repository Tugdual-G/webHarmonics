import { createF64Array, createCharArray, createPointerArray,
         cStringLength, stringToChars, Components, Data } from "./harmonicsInterface.js"
import { getPlotObj } from "./plot.js"

main();

const testResultDefault = "---------------  ,  ---------------  , ---------------";

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



function fetchComponentsSelection(){
    for (let i=0; i < available_pulsations.names.length; ++i){
        available_pulsations.compute[i] = document.getElementById(`component${i}`).checked;
    }
}

function getChosenPulsations(){
    fetchComponentsSelection();
    available_pulsations.comp_puls = [];
    for (let i = 0; i<available_pulsations.names.length; ++i){
        if ( available_pulsations.compute[i] == true ){
            available_pulsations.comp_puls.push(available_pulsations.pulsations[i])
        }
    }
}

function linspace(start, stop, array){
    const dx = (stop - start) / array.length ;
    for (let i = 0; i < array.length; ++i){
        array[i] = i * dx + start;
    }
}

function initComponentsTable(available_pulsations){
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

function fillComponentsString(ampls, phases, epoch, filename){
    available_pulsations.compStr = "#";
    available_pulsations.compStr += `from file:${filename}\n`;
    available_pulsations.compStr += "#t=0 reference datetime ";
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

function readData(data){

    const sep = document.getElementById("separator").value;
    const col_t = parseInt(document.getElementById("col_t").value);
    const col_h = parseInt(document.getElementById("col_h").value);
    const hUnits = parseFloat(document.getElementById("hUnits").value);
    // "%d/%m/%Y %H:%M:%S"
    let userFormat = document.getElementById("format").value;

    data.readData(sep, col_t, col_h, userFormat);

    for (let i = 0; i< data.h.length; ++i){
        data.h[i] *= hUnits;
    }

    const meanDataElement = document.getElementById('mean_data');
    meanDataElement.innerHTML = `\\( \\overline{h_{data}} = ${toScient(data.mean)} ~ m \\)`;
    const refDate = document.getElementById('ref_date');
    refDate.innerHTML = `dataset reference datetime : ${data.epoch}`;

}

async function analyze(components, data){
    components.analyze(data.t, data.h, data.mean);

    if (available_pulsations.compute[0]){
        components.amplitudes[0] = data.mean + components.amplitudes[0]*Math.cos(components.phases[0]);
        components.phases[0] = 0.0;
    }
}

function errorInf(arr0, arr1){
    let maxDiff = 0.0;
    let diff = 0.0;
    for (let i = 0; i < arr0.length; ++i){
        diff = Math.abs(arr0[i]-arr1[i]);
        if (diff > maxDiff){
            maxDiff = diff;
        }
    }
    return maxDiff;
}

function test(components, data){

    analyze(components, data);

    const data_test = new Data();
    data_test.h = createF64Array(data.t.length);
    data_test.t = data.t;
    data_test.epoch = data.epoch;
    data_test.mean = data.mean;

    let mean = data.mean;
    if (available_pulsations.compute[0]){
        mean = 0.0;
    }
    components.sumHarmonics(data_test.t, data_test.h, mean);
    const min = data_test.h.reduce(
        (accumulator, currentValue) => Math.min(accumulator, currentValue), data_test.h[0]);
    const max = data_test.h.reduce(
        (accumulator, currentValue) => Math.max(accumulator, currentValue), data_test.h[0]);
    const range = 0.01 * (max - min);
    for (let i = 0; i<data_test.h.length; ++i){
        data_test.h[i] += range * (2 * Math.random() - 1.0);
    }
    const components_test = new Components();
    components_test.setPulsation(components.pulsations);
    analyze(components_test, data_test);

    for (let i = 0; i < components.phases.length; ++i){
        components.phases[i] %= 2.0 * Math.PI;
        components_test.phases[i] %= 2.0 * Math.PI;
    }

    const errorAmplitudes = errorInf(components.amplitudes, components_test.amplitudes);
    const errorPhases = errorInf(components.phases, components_test.phases);


    Module._free(data_test.h.byteOffset);
    components_test.free();

    return {amplitude:errorAmplitudes, phase:errorPhases};
}

async function plotHarmonics(components, data){
    const t_fit = createF64Array(data.t.length * 2);
    const h_fit = createF64Array(data.t.length * 2);
    linspace(data.t[0], data.t[data.t.length - 1], t_fit)

    let mean_plot = data.mean;
    if (available_pulsations.compute[0]){
        mean_plot = 0.0;
    }

    components.sumHarmonics(t_fit, h_fit, mean_plot);
    const range = getRange(t_fit);

    const plotOb = getPlotObj(components, data, t_fit, h_fit, range);
    Plotly.newPlot( "graph", plotOb.plot, plotOb.layout);
    Module._free(t_fit.byteOffset);
    Module._free(h_fit.byteOffset);

}

function getErrors(components, data){
    let mean = data.mean;
    if (available_pulsations.compute[0]){
        mean = 0.0;
    }
    const errInf = components.errorInf(data.t, data.h, mean);
    const errMean = components.errorMean(data.t, data.h, mean);
    return {inf:errInf, mean:errMean};
}

function analyzeCycle(components, data){
    // document.getElementById('testResult').innerHTML = testResultDefault;
    getChosenPulsations();
    components.setPulsation(available_pulsations.comp_puls);
    const range = getRange(data.t);
    const subData = data.subData(range);
    analyze(components, subData);
    fillComponentsTable(components.amplitudes, components.phases);
    plotHarmonics(components, data);

    const errorsDataElem = document.getElementById('errorsWholeData');
    const errorsRange = document.getElementById('errorsAnalysisRange');

    const errData = getErrors(components, data);
    const errRange = getErrors(components, subData);

    errorsDataElem.innerHTML =
        `$ \\|r\\|_{\\infty} = ${toScient(errData.inf)} $ m,
         $ \\overline{|r_i|} = ${toScient(errData.mean)} $ m `


    errorsRange.innerHTML =
        `$ \\|r_{[t_{min}, t_{max}]}\\|_{\\infty} = ${toScient(errRange.inf)} $ m,
         $ \\overline{|r_{i[t_{min}, t_{max}]}|} = ${toScient(errRange.mean)} $ m `

    const meanDataElem = document.getElementById('mean_data');
    typeset(() => {
        return [meanDataElem, errorsDataElem, errorsRange];
    });
    document.getElementById('textFileLink').innerHTML = "";
}

function main(){

    Module.onRuntimeInitialized = async () => {

        initComponentsTable(available_pulsations);


        let file;
        const fileInput = document.getElementById('inselec');
        const data = new Data();

        // In case the file is cached by the navigation
        if (typeof fileInput.files[0] == "undefined"){
            document.getElementById("t_min").value = "none";
            document.getElementById("t_max").value = "2000";
            document.getElementById("separator").value = ";";
            document.getElementById("col_t").value = 0;
            document.getElementById("col_h").value = 1;
            // "%d/%m/%Y %H:%M:%S"
            document.getElementById("format").value = "%d/%m/%Y %H:%M:%S";
            data.fname = "test_data.txt";
            file = await fetch("test_data.txt");
        } else {
            file = fileInput.files[0];
            data.fname = fileInput.files[0].name;
        }

        data.txt = createCharArray(await file.bytes());
        readData(data);
        const components = new Components();
        analyzeCycle(components, data);

        const compBtn = document.getElementById('compBtn');
        compBtn.addEventListener("click", ()=>{
            analyzeCycle(components, data);
        });

        const reloadBtn = document.getElementById('reload');
        reloadBtn.addEventListener("click", ()=>{
            readData(data);
            analyzeCycle(components, data);
        });

        fileInput.onchange = async (e) => {
            file = e.target.files[0];
            Module._free(data.txt.byteOffset);
            data.txt = createCharArray(await file.bytes());
        }

        let textFile = null;
        document.getElementById('textFile').addEventListener("click", ()=>{
            fillComponentsString(components.amplitudes, components.phases, data.epoch, data.fname);
            const comptxt = new Blob([available_pulsations.compStr], {type: 'text/plain'});
            if (textFile !== null) {
                window.URL.revokeObjectURL(textFile);
            }
            textFile = window.URL.createObjectURL(comptxt);

            document.getElementById('textFileLink').href = textFile;
            document.getElementById('textFileLink').innerHTML = "components.txt";
            document.getElementById('textFileLink').download = "components.txt";
            // window.open(textFile, '_blank').focus();
        });

        // const testBtn = document.getElementById('test');
        // testBtn.addEventListener("click", ()=>{
        //     getChosenPulsations();
        //     components.setPulsation(available_pulsations.comp_puls);
        //     const range = getRange(data.t);
        //     const errors = test(components, data.subData(range));
        //     let mean = data.mean;
        //     if (available_pulsations.compute[0]){
        //         mean = 0.0;
        //     }
        //     const testElem = document.getElementById('testResult');
        //     testElem.innerHTML =
        //         `Ideal signal with noise : $~~~ ||e_{\\theta}||_{\\infty} = ${toScient(errors.phase)} $ rad ,
        //          $ ||e_{Hf}||_{\\infty} = ${toScient(errors.amplitude)} $ m `
        //     typeset(() => {
        //         return [testElem];
        //     });
        // });

    }
}
