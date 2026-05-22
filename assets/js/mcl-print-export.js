document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        window.print();

        window.onafterprint = function() {
            window.close();
        };

    }, 1000);
});
