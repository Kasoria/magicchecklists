<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>

<div class="mcl-wrap">
    <div class="mcl-header">
        <div class="mcl-title-wrapper">
            <h1 class="mcl-title">
                <?php esc_html_e('Create New Checklist', 'magic-checklists'); ?>
            </h1>
            <div class="mcl-actions">
                <a href="<?php echo admin_url('admin.php?page=mcl_checklists'); ?>" class="mcl-button mcl-button-secondary">
                    <span class="dashicons dashicons-arrow-left-alt"></span>
                    <?php esc_html_e('Back to Checklists', 'magic-checklists'); ?>
                </a>
            </div>
        </div>
        <div class="mcl-intro">
            <p class="mcl-description mcl-description-light">
                <?php esc_html_e('Choose the type of checklist you want to create. Each type serves different purposes and has unique features.', 'magic-checklists'); ?>
            </p>
        </div>
    </div>

    <div class="mcl-content">
        <div class="mcl-checklist-types">
            <div class="mcl-type-card" data-type="classic">
                <div class="mcl-type-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
                        <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                </div>
                <h3 class="mcl-type-title"><?php esc_html_e('Classic Checklist', 'magic-checklists'); ?></h3>
                <p class="mcl-type-description">
                    <?php esc_html_e('Traditional checklists with custom items, keyboard shortcuts, and floating buttons. Perfect for personal task management and team collaboration.', 'magic-checklists'); ?>
                </p>
                <div class="mcl-type-features">
                    <ul>
                        <li><?php esc_html_e('Custom checklist items', 'magic-checklists'); ?></li>
                        <li><?php esc_html_e('Keyboard shortcuts', 'magic-checklists'); ?></li>
                        <li><?php esc_html_e('Floating buttons', 'magic-checklists'); ?></li>
                        <li><?php esc_html_e('Access control', 'magic-checklists'); ?></li>
                        <li><?php esc_html_e('Themes and customization', 'magic-checklists'); ?></li>
                        <li><?php esc_html_e('Shortcode support', 'magic-checklists'); ?></li>
                    </ul>
                </div>
                <a href="<?php echo admin_url('admin.php?page=mcl_add_new&type=classic'); ?>" class="mcl-button mcl-button-primary mcl-type-button">
                    <?php esc_html_e('Create Classic Checklist', 'magic-checklists'); ?>
                </a>
            </div>

            <div class="mcl-type-card mcl-type-featured" data-type="publisher">
                <div class="mcl-type-badge">
                    <?php esc_html_e('New!', 'magic-checklists'); ?>
                </div>
                <div class="mcl-type-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                </div>
                <h3 class="mcl-type-title"><?php esc_html_e('Publisher Checklist', 'magic-checklists'); ?></h3>
                <p class="mcl-type-description">
                    <?php esc_html_e('Content publishing requirements with automatic verification. Ensure posts and pages meet quality standards before publication.', 'magic-checklists'); ?>
                </p>
                <div class="mcl-type-features">
                    <ul>
                        <li><?php esc_html_e('Automatic requirement checking', 'magic-checklists'); ?></li>
                        <li><?php esc_html_e('Word count validation', 'magic-checklists'); ?></li>
                        <li><?php esc_html_e('SEO requirements', 'magic-checklists'); ?></li>
                        <li><?php esc_html_e('Featured image verification', 'magic-checklists'); ?></li>
                        <li><?php esc_html_e('Link and taxonomy checks', 'magic-checklists'); ?></li>
                        <li><?php esc_html_e('Publishing prevention', 'magic-checklists'); ?></li>
                    </ul>
                </div>
                <a href="<?php echo admin_url('admin.php?page=mcl_add_new&type=publisher'); ?>" class="mcl-button mcl-button-primary mcl-type-button">
                    <?php esc_html_e('Create Publisher Checklist', 'magic-checklists'); ?>
                </a>
            </div>
        </div>

        <div class="mcl-type-comparison">
            <h3><?php esc_html_e('Need help choosing?', 'magic-checklists'); ?></h3>
            <div class="mcl-comparison-table">
                <table>
                    <thead>
                        <tr>
                            <th><?php esc_html_e('Feature', 'magic-checklists'); ?></th>
                            <th><?php esc_html_e('Classic Checklist', 'magic-checklists'); ?></th>
                            <th><?php esc_html_e('Publisher Checklist', 'magic-checklists'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><?php esc_html_e('Custom Items', 'magic-checklists'); ?></td>
                            <td><span class="mcl-check">✓</span></td>
                            <td><span class="mcl-cross">✗</span></td>
                        </tr>
                        <tr>
                            <td><?php esc_html_e('Automatic Verification', 'magic-checklists'); ?></td>
                            <td><span class="mcl-cross">✗</span></td>
                            <td><span class="mcl-check">✓</span></td>
                        </tr>
                        <tr>
                            <td><?php esc_html_e('Publishing Control', 'magic-checklists'); ?></td>
                            <td><span class="mcl-cross">✗</span></td>
                            <td><span class="mcl-check">✓</span></td>
                        </tr>
                        <tr>
                            <td><?php esc_html_e('Gutenberg Integration', 'magic-checklists'); ?></td>
                            <td><span class="mcl-cross">✗</span></td>
                            <td><span class="mcl-check">✓</span></td>
                        </tr>
                        <tr>
                            <td><?php esc_html_e('Keyboard Shortcuts', 'magic-checklists'); ?></td>
                            <td><span class="mcl-check">✓</span></td>
                            <td><span class="mcl-cross">✗</span></td>
                        </tr>
                        <tr>
                            <td><?php esc_html_e('Themes & Styling', 'magic-checklists'); ?></td>
                            <td><span class="mcl-check">✓</span></td>
                            <td><span class="mcl-cross">✗</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="mcl-use-cases">
                <div class="mcl-use-case">
                    <h4><?php esc_html_e('Use Classic Checklist for:', 'magic-checklists'); ?></h4>
                    <ul>
                        <li><?php esc_html_e('Personal task management', 'magic-checklists'); ?></li>
                        <li><?php esc_html_e('Team project tracking', 'magic-checklists'); ?></li>
                        <li><?php esc_html_e('General purpose checklists', 'magic-checklists'); ?></li>
                        <li><?php esc_html_e('Client-facing requirements', 'magic-checklists'); ?></li>
                    </ul>
                </div>
                
                <div class="mcl-use-case">
                    <h4><?php esc_html_e('Use Publisher Checklist for:', 'magic-checklists'); ?></h4>
                    <ul>
                        <li><?php esc_html_e('Content quality control', 'magic-checklists'); ?></li>
                        <li><?php esc_html_e('SEO compliance checking', 'magic-checklists'); ?></li>
                        <li><?php esc_html_e('Editorial workflows', 'magic-checklists'); ?></li>
                        <li><?php esc_html_e('Publication standards', 'magic-checklists'); ?></li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.mcl-checklist-types {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 40px;
}

.mcl-type-card {
    position: relative;
    background: #fff;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 30px;
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
}

.mcl-type-card:hover {
    border-color: #f2da22;
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    transform: translateY(-2px);
}

.mcl-type-featured {
    border-color: #f2da22;
    background: linear-gradient(135deg, #fff 0%, #fffef7 100%);
}

.mcl-type-badge {
    position: absolute;
    top: -10px;
    right: 20px;
    background: #f2da22;
    color: #1a1a1a;
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
}

.mcl-type-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    background: #f8f9fa;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
}

.mcl-type-featured .mcl-type-icon {
    background: #f2da22;
    color: #1a1a1a;
}

.mcl-type-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 15px;
    color: #1a1a1a;
}

.mcl-type-description {
    color: #64748b;
    margin-bottom: 25px;
    line-height: 1.6;
}

.mcl-type-features ul {
    list-style: none;
    padding: 0;
    margin: 0 0 30px;
    text-align: left;
}

.mcl-type-features li {
    padding: 8px 0;
    border-bottom: 1px solid #f1f5f9;
    position: relative;
    padding-left: 25px;
}

.mcl-type-features li:before {
    content: "✓";
    position: absolute;
    left: 0;
    color: #22c55e;
    font-weight: bold;
}

.mcl-type-button {
    width: 100%;
    padding: 0;
    border: none;
}

.mcl-type-button::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    cursor: pointer;
    z-index: 1;
}

.mcl-type-comparison {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 30px;
    margin-top: 40px;
}

.mcl-type-comparison h3 {
    text-align: center;
    margin-bottom: 30px;
    font-size: 24px;
    color: #1a1a1a;
}

.mcl-comparison-table {
    margin-bottom: 40px;
}

.mcl-comparison-table table {
    width: 100%;
    border-collapse: collapse;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.mcl-comparison-table th,
.mcl-comparison-table td {
    padding: 15px 20px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
}

.mcl-comparison-table th {
    background: #1a1a1a;
    color: #fff;
    font-weight: 600;
}

.mcl-comparison-table tr:last-child td {
    border-bottom: none;
}

.mcl-check {
    color: #22c55e;
    font-weight: bold;
    font-size: 18px;
}

.mcl-cross {
    color: #ef4444;
    font-weight: bold;
    font-size: 18px;
}

.mcl-use-cases {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
}

.mcl-use-case {
    background: #fff;
    padding: 25px;
    border-radius: 8px;
    border-left: 4px solid #f2da22;
}

.mcl-use-case h4 {
    margin: 0 0 15px;
    color: #1a1a1a;
    font-size: 18px;
}

.mcl-use-case ul {
    margin: 0;
    padding-left: 20px;
}

.mcl-use-case li {
    margin-bottom: 8px;
    color: #64748b;
}

@media (max-width: 768px) {
    .mcl-checklist-types,
    .mcl-use-cases {
        grid-template-columns: 1fr;
    }
    
    .mcl-type-card {
        padding: 20px;
    }
}
</style> 