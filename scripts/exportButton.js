function createExportButton(chart) {
    let export_button = document.querySelectorAll('.export-container');
    if (export_button.length > 0) export_button.forEach(button => { button.remove(); });
    const div = document.createElement("div");
    div.classList.add('export-container');
    const input = document.createElement("input");
    input.type = 'button';
    input.value = 'Экспорт Excel';
    input.classList.add('export');
    div.appendChild(input);
    document.body.appendChild(div);
    div.addEventListener('click', () => {
        const labels = chart.data.labels;
        const datasets = chart.data.datasets;
        const excelData = [];
        const headers = [...datasets.map(dataset => dataset.label)];
        // const headers = [avgChart.data.labels[0], ...avgChart.data.datasets.map(dataset => dataset.label)];
        excelData.push(headers);

        // Добавляем данные
        labels.forEach((label, index) => {
            const row = [label];
            datasets.forEach(dataset => {
                row.push(dataset.data[index]);
            });
            excelData.push(row);
        });

        // Преобразуем данные в формат Excel
        const ws = XLSX.utils.aoa_to_sheet(excelData); // Преобразование массива в лист
        const wb = XLSX.utils.book_new(); // Создаем новую книгу
        XLSX.utils.book_append_sheet(wb, ws, 'Chart Data'); // Добавляем лист в книгу
        XLSX.writeFile(wb, 'chart_data.xlsx');
    });

}