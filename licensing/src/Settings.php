<?php

namespace SureCart\Licensing;

/**
 * The settings class.
 */
class Settings {
	/**
	 * SureCart\Licensing\Client
	 *
	 * @var object
	 */
	protected $client;

	/**
	 * Holds the option key
	 *
	 * @var string
	 */
	private $option_key;

	/**
	 * Holds the option name
	 *
	 * @var string
	 */
	private $name;

	/**
	 * Holds the menu arguments
	 *
	 * @var array
	 */
	private $menu_args;

	/**
	 * Create the pages.
	 *
	 * @param SureCart\Licensing\Client $client The client.
	 */
	public function __construct( Client $client ) {
		$this->client     = $client;
		$this->name       = strtolower( preg_replace( '/\s+/', '', $this->client->name ) );
		$this->option_key = $this->name . '_license_options';
	}

	/**
	 * Add the settings page.
	 *
	 * @param array $args Settings page args.
	 *
	 * @return void
	 */
	public function add_page( $args ) {
		// store menu args for proper menu creation.
		$this->menu_args = wp_parse_args(
			$args,
			array(
				'type'               => 'menu', // Can be: menu, options, submenu.
				'page_title'         => 'Manage License',
				'menu_title'         => 'Manage License',
				'capability'         => 'manage_options',
				'menu_slug'          => $this->client->slug . '-manage-license',
				'icon_url'           => '',
				'position'           => null,
				'activated_redirect' => null,
				'parent_slug'        => '',
			)
		);
		add_action( 'admin_menu', array( $this, 'admin_menu' ), 99 );
	}

	/**
	 * Form action URL
	 */
	private function form_action_url() {
		return apply_filters( 'surecart_client_license_form_action', '' );
	}

	/**
	 * Set the option key.
	 *
	 * If someone wants to override the default generated key.
	 *
	 * @param string $key The option key.
	 */
	public function set_option_key( $key ) {
		$this->option_key = $key;
		return $this;
	}

	/**
	 * Add the admin menu
	 *
	 * @return void
	 */
	public function admin_menu() {
		switch ( $this->menu_args['type'] ) {
			case 'menu':
				$this->create_menu_page();
				break;
			case 'submenu':
				$this->create_submenu_page();
				break;
			case 'options':
				$this->create_options_page();
				break;
		}
	}

	/**
	 * Add license menu page
	 */
	private function create_menu_page() {
		call_user_func(
			'add_menu_page',
			$this->menu_args['page_title'],
			$this->menu_args['menu_title'],
			$this->menu_args['capability'],
			$this->menu_args['menu_slug'],
			array( $this, 'settings_output' ),
			$this->menu_args['icon_url'],
			$this->menu_args['position']
		);
	}

	/**
	 * Add submenu page
	 */
	private function create_submenu_page() {
		call_user_func(
			'add_submenu_page',
			$this->menu_args['parent_slug'],
			$this->menu_args['page_title'],
			$this->menu_args['menu_title'],
			$this->menu_args['capability'],
			$this->menu_args['menu_slug'],
			array( $this, 'settings_output' ),
			$this->menu_args['position']
		);
	}

	/**
	 * Add submenu page
	 */
	private function create_options_page() {
		call_user_func(
			'add_options_page',
			$this->menu_args['page_title'],
			$this->menu_args['menu_title'],
			$this->menu_args['capability'],
			$this->menu_args['menu_slug'],
			array( $this, 'settings_output' ),
			$this->menu_args['position']
		);
	}

	/**
	 * Get all options
	 *
	 * @return array
	 */
	public function get_options() {
		return (array) get_option( $this->option_key, array() );
	}

	/**
	 * Clear out the options.
	 *
	 * @return bool
	 */
	public function clear_options() {
		return update_option( $this->option_key, array() );
	}

	/**
	 * Get a specific option
	 *
	 * @param string $name Option name.
	 *
	 * @return mixed
	 */
	public function get_option( $name ) {
		$options = $this->get_options();
		return isset( $options[ $name ] ) ? $options[ $name ] : null;
	}

	/**
	 * Set the option.
	 *
	 * @param string $name The option name.
	 * @param mixed  $value The option value.
	 *
	 * @return bool
	 */
	public function set_option( $name, $value ) {
		$options          = (array) $this->get_options();
		$options[ $name ] = $value;
		return update_option( $this->option_key, $options );
	}

	/**
	 * The settings page menu output.
	 *
	 * @return void
	 */
	public function settings_output() {
    $this->license_form_submit();
    
    // Include our custom view file
    include dirname( $this->client->file ) . '/admin/views/license-page.php';
  }

	/**
	 * Get the activation.
	 *
	 * @return Object|false
	 */
	public function get_activation() {
		$activation = false;
		if ( $this->activation_id ) {
			$activation = $this->client->activation()->get( $this->activation_id );
			if ( is_wp_error( $activation ) ) {
				$this->add_error( 'deactivaed', $this->client->__( 'Your license has been deactivated for this site.', 'surecart' ) );
				$this->clear_options();
			}
		}
		return $activation;
	}

	/**
	 * License form submit
	 */
	public function license_form_submit() {
		// only if we are submitting.
		if ( ! isset( $_POST['submit'] ) ) {
			return;
		}

		// Check nonce.
		if ( ! isset( $_POST['_nonce'], $_POST['_action'] ) ) {
			$this->add_error( 'missing_info', $this->client->__( 'Please add all information' ) );
			return;
		}

		// Cerify nonce.
		if ( ! wp_verify_nonce( $_POST['_nonce'], $this->client->name ) ) {
			$this->add_error( 'unauthorized', $this->client->__( "You don't have permission to manage licenses." ) );
			return;
		}

		// handle activation.
		if ( 'activate' === $_POST['_action'] ) {
			$activated = $this->client->license()->activate( sanitize_text_field( $_POST['license_key'] ) );
			if ( is_wp_error( $activated ) ) {
				$this->add_error( $activated->get_error_code(), $activated->get_error_message() );
				return;
			}

			if ( ! empty( $this->menu_args['activated_redirect'] ) ) {
				$this->redirect( $this->menu_args['activated_redirect'] );
				exit;
			}

			return $this->add_success( 'activated', $this->client->__( 'This site was successfully activated.', 'surecart' ) );
		}

		// handle deactivation.
		if ( 'deactivate' === $_POST['_action'] ) {
			$deactivated = $this->client->license()->deactivate( sanitize_text_field( $_POST['activation_id'] ) );
			if ( is_wp_error( $deactivated ) ) {
				$this->add_error( $deactivated->get_error_code(), $deactivated->get_error_message() );
			}

			if ( ! empty( $this->menu_args['deactivated_redirect'] ) ) {
				$this->redirect( $this->menu_args['deactivated_redirect'] );
				exit;
			}

			return $this->add_success( 'deactivated', $this->client->__( 'This site was successfully deactivated.', 'surecart' ) );
		}
	}

	/**
	 * Redirect to a url client-side.
	 * We need to do this to avoid "headers already sent" messages.
	 *
	 * @param string $url Url to redirect.
	 *
	 * @return void
	 */
	public function redirect( $url ) {
		?>
		<div class="spinner is-active"></div>
		<script>
			window.location.assign("<?php echo esc_url( $url ); ?>");
		</script>
		<?php
	}

	/**
	 * Add a notice.
	 *
	 * @param string $code Notice code.
	 * @param string $message Notice message.
	 * @param string $type Notice type.
	 *
	 * @return void
	 */
	public function add_notice( $code, $message, $type = 'info' ) {
		add_settings_error(
			$this->name . '_license_options', // matches what we registered in `register_setting.
			$code, // the error code.
			$message,
			$type
		);
	}

	/**
	 * Add an error.
	 *
	 * @param string $code Error code.
	 * @param string $message Error message.
	 *
	 * @return void
	 */
	public function add_error( $code, $message ) {
		$this->add_notice( $code, $message, 'error' );
	}

	/**
	 * Add an success message
	 *
	 * @param string $code Success code.
	 * @param string $message Success message.
	 *
	 * @return void
	 */
	public function add_success( $code, $message ) {
		$this->add_notice( $code, $message, 'success' );
	}

	/**
	 * Set an option.
	 *
	 * @param string $name Name of option.
	 *
	 * @return mixed
	 */
	public function __get( $name ) {
		return $this->get_option( 'sc_' . $name );
	}

	/**
	 * Set an option
	 *
	 * @param string $name Name of option.
	 * @param mixed  $value Value.
	 *
	 * @return bool
	 */
	public function __set( $name, $value ) {
		return $this->set_option( 'sc_' . $name, $value );
	}
}
