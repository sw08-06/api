function getWeekStartDate(date: string): string {
    const d = new Date(date);
    const day: number = d.getDay();
    const diff: number = d.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart: Date = new Date(d.setDate(diff));
    const month: number = weekStart.getMonth() + 1;
    const dayOfMonth: number = weekStart.getDate();
    return `${month < 10 ? '0' : ''}${month}/${dayOfMonth < 10 ? '0' : ''}${dayOfMonth}`;
}

function getWeekEndDate(date: string): string {
    const d = new Date(date);
    const day: number = d.getDay();
    const diff: number = d.getDate() + (day === 0 ? 0 : 7 - day);
    const weekEnd: Date = new Date(d.setDate(diff));
    const month: number = weekEnd.getMonth() + 1;
    const dayOfMonth: number = weekEnd.getDate();
    return `${month < 10 ? '0' : ''}${month}/${dayOfMonth < 10 ? '0' : ''}${dayOfMonth}`;
}

function heatmapBins(data: any) {
    let bins: { day: string; week: string; value: number; distribution: { group: string, value: number }[] }[] = [];
    let bin: { day: string; week: string; value: number; distribution: { group: string, value: number }[] } | undefined = undefined;
    let date: string = '';

    for (let i = 0; i < data.length; i++) {
        const currentDate: string = data[i]._time.split('T')[0];
        const currentDay: string = new Date(currentDate).toLocaleDateString('en', {
            weekday: 'long'
        });
        const currentWeekStart: string = getWeekStartDate(currentDate);
        const currentWeekEnd: string = getWeekEndDate(currentDate);

        if (currentDate !== date) {
            bin = {
                day: currentDay,
                week: `${currentWeekStart} - ${currentWeekEnd}`,
                value: data[i]._value,
                distribution: [] // Initialize distribution property
            };

            // Initialize distribution for each three-hour interval
            for (let j = 0; j < 8; j++) {
                bin.distribution.push({ group: `${j * 3}-${(j + 1) * 3}`, value: 0 });
            }

            bins.push(bin);
        } else {
            if (bin) {
                bin.value += data[i]._value;
            }
        }

        // Update the corresponding three-hour interval in distribution
        const hour = new Date(data[i]._time).getHours();
        const intervalIndex = Math.floor(hour / 3);
        if (bin && intervalIndex >= 0 && intervalIndex < 8) {
            bin.distribution[intervalIndex].value += data[i]._value;
        }

        date = currentDate;
    }
    return bins;
}
