const timeAddZero = function(num = '') { 
    return `${num >= 10 ? num : '0' + num}`
}

const DEFAULT_FORMAT_STR = 'yyyy-MM-dd hh:mm:ss'

function format(date = new Date(), formatStr = DEFAULT_FORMAT_STR) {
    let [
            year,
            month, 
            day, 
            hour, 
            minute, 
            second
        ] = [
            date.getFullYear(), 
            date.getMonth() + 1, 
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds()
        ];

    let rule = {
        'yy': year - 2000,
        'yyyy': year,
        'M': month,
        'MM': timeAddZero(month),
        'd': day,
        'dd': timeAddZero(day),
        'h': hour,
        'hh': timeAddZero(hour),
        'm': minute,
        'mm': timeAddZero(minute),
        's': second,
        'ss': timeAddZero(second)
    };

    let reg = /y{2,4}|M{1,2}|d{1,2}|h{1,2}|m{1,2}|s{1,2}/g;

    let afterFormat = formatStr.replace(reg, function ($) {
        return rule[$] || $;
    });

    return afterFormat;
};

module.exports = {format}