export function getPlotObj(components, data, t_fit, h_fit, range){


    const plot = [];

    plot.push({
        x: data.t,
        y: data.h,
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


    const minFit = h_fit.reduce(
        (accumulator, currentValue) => Math.min(accumulator, currentValue), h_fit[0]);
    const maxFit = h_fit.reduce(
        (accumulator, currentValue) => Math.max(accumulator, currentValue), h_fit[0]);

    const minData = data.h.reduce(
        (accumulator, currentValue) => Math.min(accumulator, currentValue), data.h[0]);
    const maxData = data.h.reduce(
        (accumulator, currentValue) => Math.max(accumulator, currentValue), data.h[0]);

    const min = Math.min(minData, minFit);
    const max = Math.max(maxData, maxFit);

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
                x1: t_fit[range[1]-1],
                y1: max + (max - min) * 0.1,
                opacity: 0.1,
                fillcolor: 'rgb(110, 26, 74)',
            }],
            annotations: [
                {
                x: (t_fit[range[0]] + t_fit[range[1]-1])/2.0,
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


    return {
      plot:plot,
      layout:layout,
    }
;

}
