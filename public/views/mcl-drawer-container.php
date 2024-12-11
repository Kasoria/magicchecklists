<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
$theme_class = 'mcl-theme-light'; // Default theme
?>

<!-- Global rate limit error message -->
<div id="mcl-global-rate-limit-error" class="mcl-rate-limit-error mcl-global-error">
      <div class="mcl-rate-limit-error-content">
        <svg class="mcl-rate-limit-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 7C12.5523 7 13 7.44772 13 8V12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12V8C11 7.44772 11.4477 7 12 7ZM12 15C12.5523 15 13 15.4477 13 16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16C11 15.4477 11.4477 15 12 15Z" fill="currentColor"/>
        </svg>
        <span class="mcl-rate-limit-message"></span>
        <button class="mcl-rate-limit-close">×</button>
    </div>
</div>
<div id="mcl-drawer" class="<?php echo esc_attr( $theme_class ); ?>">
  <div class="mcl-drawer-content <?php echo esc_attr( $theme_class ); ?>" data-checklist-id="" data-checked-items="[]">
  <div class="mcl-locked-overlay" style="display: none;">
      <p>This checklist is currently locked for editing by another user.</p>
  </div>
    <div id="mcl-drawer-rate-limit-error" class="mcl-rate-limit-error mcl-drawer-error">
        <div class="mcl-rate-limit-error-content">
            <svg class="mcl-rate-limit-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 7C12.5523 7 13 7.44772 13 8V12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12V8C11 7.44772 11.4477 7 12 7ZM12 15C12.5523 15 13 15.4477 13 16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16C11 15.4477 11.4477 15 12 15Z" fill="currentColor"/>
            </svg>
            <span class="mcl-rate-limit-message"></span>
            <button class="mcl-rate-limit-close">×</button>
        </div>
    </div>
    <div class="mcl-drawer-header">
      <?php if (MCL_Settings::get_setting('enable_checklist_navigation', false)): ?>
        <div class="mcl-title-navigation">
          <button class="mcl-nav-arrow mcl-nav-prev" aria-label="<?php esc_attr_e('Previous checklist', 'magic-checklists'); ?>">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="mcl-nav-arrow mcl-nav-next" aria-label="<?php esc_attr_e('Next checklist', 'magic-checklists'); ?>">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      <?php endif; ?>
      <div class="mcl-drawer-tags" style="display: none;">
          <!-- Tags will be dynamically inserted here -->
      </div>
      <h2 contenteditable="true" class="mcl-drawer-title mcl-item-heading"></h2>
      <div class="mcl-access-indicator" style="display: none;">
        <svg class="mcl-access-indicator-svg" width="24px"  height="24px"  viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12.4478 15C8.34775 15 7.44775 16.6 7.44775 18.1C7.54775 19.3 8.34775 20 9.44775 20H15.4478C16.6478 20 17.4478 19.2 17.4478 18C17.4478 16.6 16.5478 15 12.4478 15Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12.4477 13.6977C14.0477 13.6977 15.2477 12.4977 15.2477 10.8977C15.2477 9.29766 14.0477 8.09766 12.4477 8.09766C10.8477 8.09766 9.64771 9.29766 9.64771 10.8977C9.64771 12.3977 10.9477 13.6977 12.4477 13.6977Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M17.5479 10.0996C17.3479 10.0996 17.1479 10.1996 16.9479 10.3996C16.8479 10.5996 16.7479 10.7996 16.7479 10.9996C16.8479 12.0996 16.7479 13.0996 16.3479 13.9996C16.2479 14.1996 16.2479 14.4996 16.4479 14.6996C16.5479 14.8996 16.8479 14.9996 17.0479 14.9996H19.9479C21.0479 14.9996 21.8479 14.0996 21.8479 12.8996C21.9479 10.9996 20.5479 10.0996 17.5479 10.0996Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M6.74766 8.8C8.04766 8.8 9.14766 7.7 9.14766 6.4C9.14766 5.1 8.04766 4 6.74766 4C5.44766 4 4.34766 5.1 4.34766 6.4C4.34766 7.7 5.44766 8.8 6.74766 8.8Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M17.8478 8.8C19.1478 8.8 20.2478 7.7 20.2478 6.4C20.2478 5.1 19.1478 4 17.8478 4C16.5478 4 15.4478 5.1 15.4478 6.4C15.4478 7.7 16.5478 8.8 17.8478 8.8Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M8.14775 13.9C7.74775 12.9 7.64775 12 7.74775 10.9C7.74775 10.7 7.74775 10.5 7.54775 10.3C7.44775 10.1 7.24775 10 6.94775 10C3.94775 10 2.44775 11 2.44775 12.8C2.44775 14 3.34775 14.9 4.44775 14.9H7.34775C7.54775 14.9 7.84775 14.8 7.94775 14.6C8.24775 14.4 8.24775 14.2 8.14775 13.9Z" fill="black"/>
        </svg>
        <span class="mcl-access-text"></span>
      </div>
      <span class="mcl-public-description" style="display: none;"></span>
      <button id="mcl-drawer-close" class="mcl-drawer-close" aria-label="<?php esc_attr_e('Close checklist', 'magic-checklists'); ?>">
      </button>
    </div>

    <div class="mcl-congratulations">
      <div class="mcl-congrats-content">
          <div class="mcl-congrats-message">
              <?php esc_html_e('Great job! 🎉', 'magic-checklists'); ?>
          </div>
      </div>
    </div>

    <div class="mcl-deadline" id="mcl-deadline-container">
      <div class="mcl-deadline-info">
        <span class="mcl-deadline-label"><?php esc_html_e( 'Deadline:', 'magic-checklists' ); ?></span>
        <span id="mcl-countdown" class="mcl-countdown" data-deadline=""></span>
      </div>
    </div>

    <div class="mcl-items-wrapper">
      <ul id="mcl-items" class="mcl-items-list">
          <!-- Checklist items will be dynamically inserted here -->
      </ul>
    </div>

    <div class="mcl-drawer-actions">
      <button id="mcl-add-item" class="mcl-drawer-button mcl-drawer-button-primary">
        <svg width="24px"  height="24px"  viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 12H18" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 6V18" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <?php esc_html_e( 'Add Item', 'magic-checklists' ); ?>
      </button>
      <button id="mcl-uncheck-all" class="mcl-drawer-button mcl-drawer-button-secondary">
        <svg class="mcl-uncheck-all-svg" width="24px"  height="24px"  viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12.25 3.75C7.69329 3.75 4 7.44329 4 12C4 16.5558 7.69335 20.25 12.25 20.25C16.8067 20.25 20.5 16.5558 20.5 12C20.5 7.44329 16.8067 3.75 12.25 3.75ZM2.5 12C2.5 6.61487 6.86487 2.25 12.25 2.25C17.6351 2.25 22 6.61487 22 12C22 17.3841 17.6352 21.75 12.25 21.75C6.86481 21.75 2.5 17.3841 2.5 12Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M9.38569 9.13471C9.67858 8.84182 10.1535 8.84182 10.4463 9.13471L12.2489 10.9373L14.0501 9.13613C14.343 8.84324 14.8178 8.84324 15.1107 9.13613C15.4036 9.42903 15.4036 9.9039 15.1107 10.1968L13.3096 11.9979L15.1166 13.805C15.4095 14.0979 15.4095 14.5727 15.1166 14.8656C14.8237 15.1585 14.3488 15.1585 14.056 14.8656L12.2489 13.0586L10.4482 14.8593C10.1554 15.1522 9.68048 15.1522 9.38759 14.8593C9.09469 14.5664 9.09469 14.0915 9.38759 13.7986L11.1883 11.9979L9.38569 10.1954C9.09279 9.90248 9.09279 9.4276 9.38569 9.13471Z" fill="black"/>
        </svg>
        <?php esc_html_e( 'Uncheck All', 'magic-checklists' ); ?>
      </button>
    </div>
  </div>
</div>