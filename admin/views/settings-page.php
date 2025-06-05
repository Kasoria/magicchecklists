<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>

<!-- React Admin App Container -->
<div id="mcl-admin-root"></div>

<script>
// Override the initial tab to settings when loading this page
document.addEventListener('DOMContentLoaded', function() {
    if (window.mclAdminData) {
        window.mclAdminData.initialTab = 'settings';
    }
});
</script>
