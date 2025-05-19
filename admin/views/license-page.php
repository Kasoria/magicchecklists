<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Mask a license key for display.
 * Shows first 5 and last 5 characters, replaces middle with 'X'.
 *
 * @param string $license_key The license key to mask.
 * @return string
 */
function mcl_mask_license_key( $license_key ) {
    if ( empty( $license_key ) ) {
        return '';
    }
    $length = strlen( $license_key );
    if ( $length <= 10 ) {
        return str_repeat( 'X', $length );
    }
    return substr( $license_key, 0, 5 ) . str_repeat( 'X', $length - 10 ) . substr( $license_key, -5 );
}

$activation = $this->get_activation();
$action     = ! empty( $activation->id ) ? 'deactivate' : 'activate';
$license_key = $this->license_key;
?>

<div class="mcl-wrap">
    <div class="mcl-header">
        <div class="mcl-title-wrapper">
            <h1 class="mcl-title">
                <?php echo esc_html( $this->menu_args['page_title'] ); ?>
            </h1>
        </div>
        <div class="mcl-intro">
            <p class="mcl-description mcl-description-light">
                <?php if ( 'activate' === $action ) : ?> 
                    <?php echo esc_html( sprintf( $this->client->__( 'Enter your license key to activate %s.', 'magic-checklists' ), $this->client->name ) ); ?>
                <?php else : ?>
                    <?php echo esc_html( sprintf( $this->client->__( 'Your license is successfully activated for this site.', 'magic-checklists' ), $this->client->name ) ); ?>
                <?php endif; ?>
            </p>
        </div>
    </div>

    <div class="mcl-content">
        <?php settings_errors(); ?>
        
        <form method="post" action="<?php echo esc_attr( $this->form_action_url() ); ?>" class="mcl-form">
            <input type="hidden" name="_action" value="<?php echo esc_attr( $action ); ?>">
            <input type="hidden" name="_nonce" value="<?php echo esc_attr( wp_create_nonce( $this->client->name ) ); ?>">
            <input type="hidden" name="activation_id" value="<?php echo esc_attr( $this->activation_id ); ?>">
            
            <div class="mcl-form-section">
                <div class="mcl-form-group">
                    <?php if ( 'activate' === $action ) : ?>
                        <label for="license_key_input" class="mcl-label">
                            <?php echo esc_html( $this->client->__( 'License Key', 'magic-checklists' ) ); ?>
                        </label>
                        <input 
                            class="mcl-input" 
                            type="text" 
                            name="license_key" 
                            id="license_key_input" 
                            value="<?php echo esc_attr( $license_key ); ?>" 
                            placeholder="<?php echo esc_attr( $this->client->__( 'Enter your license key', 'magic-checklists' ) ); ?>"
                            autocomplete="off"
                            required
                        >
                    <?php else : ?>
                        <label id="license_display_label" class="mcl-label">
                            <?php echo esc_html( $this->client->__( 'License Key', 'magic-checklists' ) ); ?>
                        </label>
                        <div 
                            class="mcl-license-display" 
                            aria-labelledby="license_display_label"
                            role="status"
                        >
                            <?php echo esc_html( mcl_mask_license_key( $license_key ) ); ?>
                        </div>
                    <?php endif; ?>

                    <?php if ( ! empty( $activation ) ) : ?>
                        <div class="mcl-activation-info" aria-live="polite">
                            <p class="mcl-description">
                                <span class="dashicons dashicons-yes-alt" aria-hidden="true"></span>
                                <?php echo esc_html( sprintf( 
                                    $this->client->__( 'Activated on: %s', 'magic-checklists' ),
                                    esc_html( get_bloginfo( 'name' ) )
                                ) ); ?>
                            </p>
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <div class="mcl-form-actions">
                <?php if ( 'activate' === $action ) : ?>
                    <button type="submit" class="mcl-button mcl-button-primary" name="submit">
                        <span class="dashicons dashicons-yes" aria-hidden="true"></span>
                        <?php echo esc_html( $this->client->__( 'Activate License', 'magic-checklists' ) ); ?>
                    </button>
                <?php else : ?>
                    <button type="submit" class="mcl-button mcl-button-danger" name="submit">
                        <span class="dashicons dashicons-no-alt" aria-hidden="true"></span>
                        <?php echo esc_html( $this->client->__( 'Deactivate License', 'magic-checklists' ) ); ?>
                    </button>
                <?php endif; ?>
            </div>
        </form>
    </div>
</div>

<style>
h1.mcl-title {
  font-size: var(--mcl-font-size-3xl);
  font-weight: 700;
}

.mcl-license-display {
    background: var(--mcl-surface);
    padding: var(--mcl-spacing-md);
    border-radius: var(--mcl-radius-md);
    border: 1px solid var(--mcl-border);
    font-family: monospace;
    font-size: var(--mcl-font-size-lg);
    letter-spacing: 2px;
}

.mcl-activation-info {
    margin-top: var(--mcl-spacing-md);
}

.mcl-activation-info .dashicons {
    color: var(--mcl-success);
    margin-right: var(--mcl-spacing-xs);
}

.mcl-form-actions {
    margin-top: var(--mcl-spacing-lg);
}

.mcl-form-actions .dashicons {
    margin-right: var(--mcl-spacing-xs);
}

.mcl-button-danger {
    background: var(--mcl-danger);
    color: white;
}

.mcl-button-danger:hover {
    background: #dc2626;
    transform: translateY(-1px);
}
</style>