// Triumph Rocket 3 Map Viewer - Hauptlogik
// Erwartet: datasetsAFR, rpmLabels, throttleLabels, throttleValues, throttleValuesWithPlateaus
// Erwartet: Plotly.js ist geladen

let currentMode = 'single';
let currentMapType = 'AFR';

// ==================== 3D CHART RENDERING ====================
function render3DChart(data, title) {
    const zData = data.map(row => row.slice(1));
    const zDataWithPlateaus = zData.map(row => {
        const firstVal = row[0];
        const lastVal = row[row.length - 1];
        return [firstVal, firstVal, firstVal, ...row, lastVal, lastVal, lastVal];
    });
    const zDataInverted = zDataWithPlateaus.map(row => row.map(val => (26.5 - val) * 0.33));
    
    const allZValues = zDataInverted.flat();
    const minZ = Math.min(...allZValues);
    const maxZ = Math.max(...allZValues);
    const zPadding = (maxZ - minZ) * 0.1;
    
    const trace = {
        z: zDataInverted,
        x: throttleValuesWithPlateaus,
        y: rpmLabels,
        type: 'surface',
        colorscale: [
            [0, '#1a4d7a'],
            [0.20, '#2980b9'],
            [0.40, '#5dade2'],
            [0.55, '#85c1e2'],
            [0.70, '#f39c12'],
            [0.85, '#e67e22'],
            [1, '#c0392b']
        ],
        colorbar: {
            title: 'AFR',
            titleside: 'right',
            tickmode: 'array',
            tickvals: [12.0, 12.5, 13.0, 13.5, 14.0, 14.5].map(v => (26.5 - v) * 0.5),
            ticktext: ['12.0', '12.5', '13.0', '13.5', '14.0', '14.5']
        },
        contours: {
            z: {
                show: true,
                usecolormap: true,
                highlightcolor: "#fff",
                project: {z: true}
            }
        }
    };
    
    const layout = {
        title: {
            text: title + ' - 3D Ansicht',
            font: { size: 20, color: '#3498db' }
        },
        scene: {
            xaxis: {
                title: 'Gasgriff (%)',
                titlefont: { color: '#fff' },
                tickfont: { color: '#fff' },
                gridcolor: '#444',
                showbackground: true,
                backgroundcolor: '#2c3e50',
                autorange: 'reversed',
                range: [-5, 105]
            },
            yaxis: {
                title: 'Drehzahl (U/min)',
                titlefont: { color: '#fff', size: 14 },
                tickfont: { color: '#fff', size: 12 },
                gridcolor: '#444',
                showbackground: true,
                backgroundcolor: '#2c3e50',
                autorange: 'reversed',
                range: [8500, 0],
                tickmode: 'array',
                tickvals: [8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000, 500],
                ticktext: ['8000', '7000', '6000', '5000', '4000', '3000', '2000', '1000', '500']
            },
            zaxis: {
                title: 'Kraftstoff (mehr Sprit = höher)',
                titlefont: { color: '#fff' },
                tickfont: { color: '#fff' },
                gridcolor: '#444',
                showbackground: true,
                backgroundcolor: '#2c3e50',
                tickmode: 'array',
                tickvals: [12.0, 12.5, 13.0, 13.5, 14.0, 14.5].map(v => (26.5 - v) * 0.33),
                ticktext: ['12.0<br>(fett)', '12.5', '13.0', '13.5', '14.0', '14.5<br>(mager)'],
                range: [minZ - zPadding, maxZ + zPadding]
            },
            camera: {
                eye: { x: 1.5, y: 1.5, z: 1.3 }
            },
            bgcolor: '#1a1a1a'
        },
        paper_bgcolor: '#1a1a1a',
        plot_bgcolor: '#1a1a1a',
        font: { color: '#fff' },
        autosize: true,
        margin: { l: 0, r: 0, b: 0, t: 50 }
    };
    
    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false
    };
    
    Plotly.newPlot('chart3d', [trace], layout, config);
}

// ==================== HELPER FUNCTIONS ====================
function updateMapType(){
    const selectedType = document.getElementById('mapTypeSelect').value;
    if(selectedType !== 'AFR') {
        document.getElementById('mapTypeSelect').value = 'AFR';
        currentMapType = 'AFR';
    } else {
        currentMapType = selectedType;
    }
    updateDisplay();
}

function getCurrentDatasets(){
    return datasetsAFR;
}

function getColorClass(v){
    if(v>=14.5)return'afr-145-150';
    if(v>=14.0)return'afr-140-145';
    if(v>=13.5)return'afr-135-140';
    if(v>=13.0)return'afr-130-135';
    if(v>=12.5)return'afr-125-130';
    if(v>=12.0)return'afr-120-125';
    return'afr-under-120';
}

function getDeltaColorClass(d){
    if(d === 0) return 'delta-zero-exact';
    if(d<=-0.5)return'delta-negative-large';
    if(d<=-0.1)return'delta-negative';
    if(d>=0.5)return'delta-positive-large';
    if(d>=0.1)return'delta-positive';
    return'delta-zero';
}

// ==================== TABLE RENDERING ====================
function renderTable(data,mode='normal',dataA=null,dataB=null){
    const tbody=document.getElementById('tableBody');
    tbody.innerHTML='';
    data.forEach((row,rowIndex)=>{
        const tr=document.createElement('tr');
        row.forEach((cell,index)=>{
            const td=document.createElement('td');
            if(index===0){
                td.className='rpm-col';
                td.textContent=cell;
            }else{
                if(mode==='delta'){
                    const delta=dataA[rowIndex][index]-dataB[rowIndex][index];
                    td.className=getDeltaColorClass(delta);
                    td.textContent=(delta>=0?'+':'')+delta.toFixed(2);
                }else{
                    td.className=getColorClass(cell);
                    td.textContent=cell.toFixed(2);
                }
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

// ==================== MODE SWITCHING ====================
function setMode(){
    currentMode=document.getElementById('modeSelect').value;
    if(currentMode==='single'){
        document.getElementById('singleControls').style.display='flex';
        document.getElementById('deltaControls').style.display='none';
    }else{
        document.getElementById('singleControls').style.display='none';
        document.getElementById('deltaControls').style.display='flex';
    }
    updateDisplay();
}

// ==================== MAIN UPDATE FUNCTION ====================
function updateDisplay(){
    const datasets = getCurrentDatasets();
    const viewMode = document.getElementById('viewMode')?.value || 'table';
    
    if(currentMode==='single'){
        const version=document.getElementById('singleVersion').value;
        const data=datasets[version];
        
        if(viewMode === '3d') {
            document.getElementById('chart3d').style.display = 'block';
            document.getElementById('dataTable').style.display = 'none';
            const versionNames = {
                'standard': 'ORIGINAL R/GT',
                'optimiert': 'ORIGINAL TFC',
                'pershing': 'PERSHING GTO'
            };
            render3DChart(data, versionNames[version]);
        } else {
            document.getElementById('chart3d').style.display = 'none';
            document.getElementById('dataTable').style.display = 'table';
            renderTable(data);
        }
    }else{
        document.getElementById('chart3d').style.display = 'none';
        document.getElementById('dataTable').style.display = 'table';
        const versionA=document.getElementById('versionA').value;
        const versionB=document.getElementById('versionB').value;
        const dataA=datasets[versionA];
        const dataB=datasets[versionB];
        renderTable(dataA,'delta',dataA,dataB);
    }
}

// ==================== INITIALIZATION ====================
// Diese Funktion wird aufgerufen, wenn das DOM bereit ist
function initApp() {
    updateDisplay();
}

// Warte auf DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}