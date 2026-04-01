List of issues found


## The link to the ajax endpoint may not work in some configurations.

When you link to the Ajax endpoint, you cannot assume that it's always located at wp-admin/admin-ajax.php. There are different configurations in which that won't work.

This means you can't link it statically, you have to use a function to determine its location, for example: admin_url( 'admin-ajax.php' );

Obviously you would need to execute that call on PHP and then pass the information to your JS file, you can do that using the wp_localize_script() function which is also useful for other uses like passing the nonce. Let me share an example:

function magicc_scripts() {
wp_enqueue_script( 'magicc-script', MAGICC_PLUGIN_URL . 'js/script.js', array(), MAGICC_VERSION );

wp_localize_script( 'magicc-script', 'magicc-ajax', array(
  'ajax_url' => admin_url('admin-ajax.php'),
  'nonce'  => wp_create_nonce( 'magicc-ajax-nonce' ),
));
}
add_action( 'wp_enqueue_scripts', 'magicc_scripts' );

Once you have this, you can later refer to your Ajax endpoint in the JS file by using the magicc-ajax.ajax_url variable. Please refer to the Ajax documentation: https://developer.wordpress.org/plugins/javascript/ajax/

Example(s) from your plugin:
includes/class-mcl-tour-public.php:599 '/wp-admin/admin-ajax.php', // AJAX calls



## No publicly documented resource for your generated/compressed content

In reviewing your plugin, we cannot find a non-compiled version of your javascript and/or css related source code.

In order to comply with our guidelines of human-readable code, we require you to include the source code and / or a link to the source code, this is true for your own code and for developer libraries you’ve included in your plugin. If you include a link, this may be in your source code, however we require you to also have it in your readme.

https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/#4-code-must-be-mostly-human-readable

We strongly feel that one of the strengths of open source is the ability to review, observe, and adapt code. By maintaining a public directory of freely available code, we encourage and welcome future developers to engage with WordPress and push it forward.

That said, with the advent of larger and larger plugins using more complex libraries, people are making good use of build tools (such as composer or npm) to generate their distributed production code. In order to balance the need to keep plugin sizes smaller while still encouraging open source development, we require plugins to make the source code to any compressed files available to the public in an easy to find location, by documenting it in the readme.

For example, if you’ve made a Gutenberg plugin and used npm and webpack to compress and minify it, you must either include the source code within the published plugin or provide access to a public maintained source that can be reviewed, studied, and yes, forked.

🔗 If you choose to add a link to a repository, please make sure that the repository exists and is publicly accessible. We will check those links in the next review.

We strongly recommend you include directions on the use of any build tools to encourage future developers.

From your plugin:
dist/admin.js:67  ...*/function kl(i,e){(e==null||e>i.length)&&(e=i.length);for(var t=0,s=Array(e);t<e;t++)s[t]=i[t];return s}function md(i){if(i===void 0)throw new ReferenceError("this hasn't been initialised - super() h... 
dist/index-C-pzIMOS.js:1  ...var Y=Object.defineProperty;var M=Object.getOwnPropertySymbols;var z=Object.prototype.hasOwnProperty,I=Object.prototype.propertyIsEnumerable;var T=(e,a,r)=>a in e?Y(e,a,{enumerable:!0,configurable:!0,... 
dist/flowbite-BEPYMb4p.js:9  ...ntOwner,Xl={key:!0,ref:!0,__self:!0,__source:!0};function Za(e,t,r){var n,i={},o=null,a=null;r!==void 0&&(o=""+r),t.key!==void 0&&(o=""+t.key),t.ref!==void 0&&(a=t.ref);for(n in t)Yl.call(t,n)&&!Xl.ha... 
dist/vendor-CgagIlFr.js:9  ...*/var Kn=Symbol.for("react.element"),qa=Symbol.for("react.portal"),ba=Symbol.for("react.fragment"),ef=Symbol.for("react.strict_mode"),tf=Symbol.for("react.profiler"),nf=Symbol.for("react.provider"),rf... 
dist/utils-Dxn7UlHH.js:9  ...*/var ht=v;function Ja(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var Za=typeof Object.is=="function"?Object.is:Ja,Qa=ht.useSyncExternalStore,es=ht.useRef,ts=ht.useEffect,ns=ht.useMemo,rs=ht.... 
dist/admin.js:1  ...var xh=Object.defineProperty,fh=Object.defineProperties;var mh=Object.getOwnPropertyDescriptors;var An=Object.getOwnPropertySymbols;var Bc=Object.prototype.hasOwnProperty,Oc=Object.prototype.propertyI... 
dist/utils-Dxn7UlHH.js:1  ...var Ga=Object.defineProperty,Ha=Object.defineProperties;var Wa=Object.getOwnPropertyDescriptors;var St=Object.getOwnPropertySymbols;var Tr=Object.prototype.hasOwnProperty,Lr=Object.prototype.propertyI... 
dist/flowbite-BEPYMb4p.js:1  ...var zl=Object.defineProperty,Vl=Object.defineProperties;var Bl=Object.getOwnPropertyDescriptors;var Fr=Object.getOwnPropertySymbols;var Po=Object.prototype.hasOwnProperty,No=Object.prototype.propertyI... 
... out of a total of 10 incidences.


## Use wp_enqueue commands

Your plugin is not correctly including JS and/or CSS. You should be using the built in functions for this:

When including JavaScript code you can use:
wp_register_script() and wp_enqueue_script() to add JavaScript code from a file.
wp_add_inline_script() to add inline JavaScript code to previous declared scripts.

When including CSS you can use:
wp_register_style() and wp_enqueue_style() to add CSS from a file.
wp_add_inline_style() to add inline CSS to previously declared CSS.

Note that as of WordPress 6.3, you can easily pass attributes like defer or async: https://make.wordpress.org/core/2023/07/14/registering-scripts-with-async-and-defer-attributes-in-wordpress-6-3/

Also, as of WordPress 5.7, you can pass other attributes by using this functions and filters: https://make.wordpress.org/core/2021/02/23/introducing-script-attributes-related-functions-in-wordpress-5-7/

If you're trying to enqueue on the admin pages you'll want to use the admin enqueues.

https://developer.wordpress.org/reference/hooks/admin_enqueue_scripts/
https://developer.wordpress.org/reference/hooks/admin_print_scripts/
https://developer.wordpress.org/reference/hooks/admin_print_styles/

Example(s) from your plugin:
includes/class-mcl-settings.php:706 <style>
includes/class-mcl-react-dev.php:1138 <style>
includes/class-mcl-settings.php:742 <script>
includes/class-mcl-settings.php:931 <script>
includes/class-mcl-admin.php:361 <script>
includes/class-mcl-export-handler.php:291 <script>
includes/class-mcl-export-handler.php:178 <style>
includes/class-mcl-settings.php:997 <script>
... out of a total of 11 incidences.


## Undocumented use of a 3rd Party / external service

Plugins are permitted to require the use of third party/external services as long as they are clearly documented.

When your plugin reach out to external services, you must disclose it. This is true even if you are the one providing that service.

You are required to document it in a clear and plain language, so users are aware of: what data is sent, why, where and under which conditions.

To do this, you must update your readme file to clearly explain that your plugin relies on third party/external services, and include at least the following information for each third party/external service that this plugin uses:
What the service is and what it is used for.
What data is sent and when.
Provide links to the service's terms of service and privacy policy.
Remember, this is for your own legal protection. Use of services must be upfront and well documented. This allows users to ensure that any legal issues with data transmissions are covered.

Example:
== External services ==

This plugin connects to an API to obtain weather information, it's needed to show the weather information and forecasts in the included widget.

It sends the user's location every time the widget is loaded (If the location isn't available and/or the user hasn't given their consent, it displays a configurable default location).
This service is provided by "PRT Weather INC": terms of use, privacy policy.

🔗 Please verify that the terms and privacy links exist and they have the proper content. We will check those links in the next review.

Example(s) from your plugin:
# Domain(s) not mentioned in the readme file.
dist/admin.js:63 ...s.slack.com/")||k==="discord"&&!v.startsWith("https://discord.com/api/webhooks/")):!0;return o.jsxs("div",{className:"space-y-6",children:[o.jsx(Ot,{children:o.jsxs("div",{className:"flex items-center...  ...ue),placeholder:c.discordWebhookPlaceholder||"https://discord.com/api/webhooks/...",color:i.discord_webhook_url&&!g(i.discord_webhook_url,"discord")?"failure":"gray"}),i.discord_webhook_url&&!g(i.disc...



## Calling core loading files directly

Calling core files like wp-config.php, wp-blog-header.php, wp-load.php directly via an include is not permitted.

These calls are prone to failure as not all WordPress installs have the exact same file structure. In addition it opens your plugin to security issues, as WordPress can be easily tricked into running code in an unauthenticated manner.

Your code should always exist in functions and be called by action hooks. This is true even if you need code to exist outside of WordPress. Code should only be accessible to people who are logged in and authorized, if it needs that kind of access. Your plugin's pages should be called via the dashboard like all the other settings panels, and in that way, they'll always have access to WordPress functions.

https://developer.wordpress.org/plugins/hooks/

There are some exceptions to the rule in certain situations and for certain core files. In that case, we expect you to use require_once to load them and to use a function from that file immediately after loading it.

If you are trying to "expose" an endpoint to be accessed directly by an external service, you have some options.
You can expose a 'page' use query_vars and/or rewrite rules to create a virtual page which calls a function. A practical example.
You can create an AJAX endpoint.
You can create a REST API endpoint.

Example(s) from your plugin:
includes/class-mcl-admin.php:577 require_once(ABSPATH . 'wp-admin/includes/admin.php');
# ✨ Loads wp-admin/includes/admin.php in an AJAX/admin flow to manually build admin menus, which is unjustified core bootstrapping.
includes/class-mcl-admin.php:572 require_once(ABSPATH . 'wp-admin/includes/screen.php');
# ✨ Loads wp-admin/includes/screen.php conditionally, but no function or class from that file is used afterward.
includes/class-mcl-export-handler.php:452 require_once ABSPATH . 'wp-includes/class-phppdf.php';
# ✨ Directly requires a WordPress core file from wp-includes for PDF generation, which is not an allowed exception.
includes/class-mcl-admin.php:115 require_once(ABSPATH . 'wp-admin/includes/admin.php');
# ✨ Loads wp-admin/includes/admin.php inside the admin_menu callback even though WordPress admin is already loaded.



## Determine files and directories locations correctly

WordPress provides several functions for easily determining where a given file or directory lives.

We detected that the way your plugin references some files, directories and/or URLs may not work with all WordPress setups. This happens because there are hardcoded references or you are using the WordPress internal constants.

Let's improve it, please check out the following documentation:

https://developer.wordpress.org/plugins/plugin-basics/determining-plugin-and-content-directories/

It contains all the functions available to determine locations correctly.

Most common cases in plugins can be solved using the following functions:
For where your plugin is located: plugin_dir_path(), plugin_dir_url(), plugins_url()
For the uploads directory: wp_upload_dir() (Note: If you need to write files, please do so in a folder in the uploads directory, not in your plugin directories).

Example(s) from your plugin:
includes/class-mcl-settings.php:1393 $full_path = WP_PLUGIN_DIR . '/' . $language_dir;
magicchecklists.php:134 $new_mofile = WP_PLUGIN_DIR . '/' . $languages_path . 'magic-checklists-' . $plugin_language . '.mo';
 -----> WP_PLUGIN_DIR



ℹ️ In order to determine your plugin location, you would need to use the __FILE__ variable for this to work properly.
Note that this variable depends on the location of the file making the call. As this can create confusion, a common practice is to save its value in a define() in the main file of your plugin so that you don't have to worry about this.

Example: Your main plugin file.
define( 'MAGICC_PLUGIN_FILE', __FILE__ );
define( 'MAGICC_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'MAGICC_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

Example: Any file of your plugin.

require_once MAGICC_PLUGIN_DIR . 'admin/class-init.php';


function magicc_scripts() {
 wp_enqueue_script( 'magicc-script', MAGICC_PLUGIN_URL . 'js/script.js', array(), MAGICC_VERSION );
 // Or alternatively
 wp_enqueue_script( 'magicc-script', plugins_url( 'js/script.js', MAGICC_PLUGIN_FILE ), array(), MAGICC_VERSION );
}
add_action( 'wp_enqueue_scripts', 'magicc_scripts' );


Example(s) from your plugin:
includes/class-mcl-settings.php:1393 $full_path = WP_PLUGIN_DIR . '/' . $language_dir;
magicchecklists.php:134 $new_mofile = WP_PLUGIN_DIR . '/' . $languages_path . 'magic-checklists-' . $plugin_language . '.mo';
 -----> WP_PLUGIN_DIR



## Please use WordPress' file uploader

When plugins use move_uploaded_file(), they exclude their uploads from the built-in checks and balances with WordPress's functions. Instead of that, you should use the built in function:

https://developer.wordpress.org/reference/functions/wp_handle_upload/

Example(s) from your plugin:
includes/class-mcl-image-handler.php:159 move_uploaded_file($file['tmp_name'], $filepath);



## Check permission_callback in REST API Route

When using register_rest_route() or wp_register_ability() to define custom REST API endpoints, it is crucial to include a proper permission_callback.

🔒 This callback function ensures that only authorized users can access or modify data through your endpoint.

Code example, checking that the user can change options:
register_rest_route( 'magicchecklists/v1', '/my-endpoint', array(
    'methods' => 'GET',
    'callback' => 'magicchecklists_callback_function',
    'permission_callback' => function() {
        return current_user_can( 'manage_options' );
    }
) );

Please check the register_rest_route() documentation and the current_user_can() documentation.

✅ When a permission_callback is NOT Required:

There are valid use cases for public endpoints, such as publicly available data (e.g., posts, public metadata) or endpoints designed for unauthenticated access (e.g., fetching public stats or information).

In these cases, you should use __return_true as the permission_callback to indicate that the endpoint is intentionally public.

🔒 When a permission_callback IS Required:

For endpoints that involve sensitive data or actions (e.g., getting not public data, creating, updating, or deleting content).

In these cases, you should always implement proper permission checks.

Possible cases found on this plugin's code:
includes/class-mcl-rest-controller.php:308 register_rest_route($this->namespace_v1, '/' . $this->rest_base . '/(?P<id>[\\d]+)', [['methods' => WP_REST_Server::READABLE, 'callback' => [$this, 'get_item'], 'permission_callback' => $this->wrap_permission_callback([$this, 'get_item_permissions_check']), 'args' => ['id' => ['validate_callback' => function ($param) {
    return is_numeric($param);
}]]], ['methods' => WP_REST_Server::EDITABLE, 'callback' => [$this, 'update_item'], 'permission_callback' => $this->wrap_permission_callback([$this, 'update_item_permissions_check']), 'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE)], ['methods' => WP_REST_Server::DELETABLE, 'callback' => [$this, 'delete_item'], 'permission_callback' => $this->wrap_permission_callback([$this, 'delete_item_permissions_check'])]]);
# ✨ Read permission is too broad: get_item_permissions_check allows any logged-in user to read any non-public checklist, exposing full checklist/meta data  
includes/class-mcl-rest-controller.php:270 register_rest_route($this->namespace_v2, '/debug', [['methods' => WP_REST_Server::READABLE, 'callback' => function ($request) {
    $auth_header = $request->get_header('Authorization');
    $api_key = str_replace('Bearer ', '', $auth_header);
    $settings = get_option('mcl_integration_settings', []);
    $stored_key = $settings['mainwp_api_key'] ?? '';
    return rest_ensure_response(['has_auth_header' => !empty($auth_header), 'auth_header_starts_with_bearer' => strpos($auth_header, 'Bearer ') === 0, 'api_key_length' => strlen($api_key), 'stored_key_exists' => !empty($stored_key), 'keys_match' => $api_key === $stored_key]);
}, 'permission_callback' => '__return_true']]);
# ✨ Public debug endpoint uses __return_true while exposing API-key validation/debug details that should not be unauthenticated 
includes/class-mcl-rest-controller.php:292 register_rest_route($this->namespace_v1, '/' . $this->rest_base, [['methods' => WP_REST_Server::READABLE, 'callback' => [$this, 'get_items'], 'permission_callback' => $this->wrap_permission_callback([$this, 'get_items_permissions_check']), 'args' => $this->get_collection_params()], ['methods' => WP_REST_Server::CREATABLE, 'callback' => [$this, 'create_item'], 'permission_callback' => $this->wrap_permission_callback([$this, 'create_item_permissions_check']), 'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::CREATABLE)]]);
# ✨ Collection read permission is too broad: get_items_permissions_check effectively allows any logged-in user to list publish and draft checklists  



## Internationalization: Text domain does not match plugin slug.

In order to make a string translatable in your plugin you are using a set of special functions. These functions collectively are known as "gettext".

These functions have a parameter called "text domain", which is a unique identifier for retrieving translated strings.

This "text domain" must be the same as your plugin slug so that the plugin can be translated by the community using the tools provided by the directory. As for example, if this plugin slug is "magicchecklists" the Internationalization functions should look like:
esc_html__( 'Hello', 'magicchecklists' );

From your plugin, you have set your text domain as follows:
# This plugin is using the domain "magic-checklists" for 2146 element(s).

However, the current plugin slug is this:
magicchecklists



## Nonces and User Permissions Needed for Security

Please add a nonce check to your input calls ($_POST, $_GET, $REQUEST) to prevent unauthorized access.

If you use wp_ajax_ to trigger submission checks, remember they also need a nonce check.

👮 Checking permissions: Keep in mind, a nonce check alone is not bulletproof security. Do not rely on nonces for authorization purposes. When needed, use it together with current_user_can() in order to prevent users without the right permissions from accessing things they shouldn't.

Also make sure that the nonce logic is correct by making sure it cannot be bypassed. Checking the nonce with current_user_can() is great, but mixing it with other checks can make the condition more complex and, without realising it, bypassable, remember that anything can be sent through an input, don't trust any input.

Keep performance in mind. Don't check for post submission outside of functions. Doing so means that the check will run on every single load of the plugin, which means that every single person who views any page on a site using your plugin will be checking for a submission. This will make your code slow and unwieldy for users on any high traffic site, leading to instability and eventually crashes.

The following links may assist you in development:

https://developer.wordpress.org/plugins/security/nonces/
https://developer.wordpress.org/plugins/javascript/ajax/#nonce
https://developer.wordpress.org/plugins/settings/settings-api/

From your plugin:
includes/class-mcl-public.php:1598 MCL_Public::save_checked_state() [classMethod] No nonce check found validating input origin on lines 1598-1609
# ↳ Line 1599: $checklist_id = intval($_POST['checklist_id']);
# ↳ Line 1600: $context = sanitize_text_field($_POST['context'] ?? 'drawer');
# ↳ Line 1616: json_decode(stripslashes($_POST['checked_items']), true) : array();
# ✨ Checked-state saving verifies a nonce only for logged-in users; the nopriv AJAX route can still update server-side state for permitted public/interact contexts without nonce protection  
includes/class-mcl-public.php:2240 MCL_Public::delete_item() [classMethod] No nonce check found validating input origin on lines 2240-2250
# ↳ Line 2241: $checklist_id = intval($_POST['checklist_id'] ?? 0);
# ✨ The delete-item AJAX endpoint is available to wp_ajax and wp_ajax_nopriv and deletes checklist items after an edit-permission check, but it lacks any nonce validation  
includes/class-mcl-public.php:1027 MCL_Public::release_checklist_lock() [classMethod] No nonce check found validating input origin on lines 1027-1035
# ↳ Line 1028: $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
# ✨ The nopriv AJAX lock-release endpoint changes checklist lock state and checks edit permission, but it has no nonce verification, so authorized users/invite sessions are exposed to CSRF  
includes/class-mcl-tour-admin.php:667 MCL_Tour_Admin::get_item_tour_connections() [classMethod] No nonce check found validating input origin on lines 667-672
# ↳ Line 672: } elseif (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_tour_public')) {
# ↳ Line 674: } elseif (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_ajax_nonce')) {
# ↳ Line 676: } elseif (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_ajax_nopriv_nonce')) {
# ✨ Although a nonce is checked, this wp_ajax/wp_ajax_nopriv endpoint returns active tour connection details without any capability or checklist permission check, exposing tour metadata to anyone with a valid public nonce  
includes/class-mcl-public.php:3257 MCL_Public::toggle_item_upvote() [classMethod] No nonce check found validating input origin on lines 3257-3273
# ↳ Line 3258: $checklist_id = isset($_POST['checklist_id']) ? intval($_POST['checklist_id']) : 0;
# ↳ Line 3259: $item_id = isset($_POST['item_id']) ? sanitize_text_field($_POST['item_id']) : '';
# ↳ Line 3260: $user_email = isset($_POST['user_email']) ? sanitize_email($_POST['user_email']) : '';
# ↳ Line 3261: $user_name = isset($_POST['user_name']) ? sanitize_text_field($_POST['user_name']) : '';
# ✨ This public/nopriv upvote toggle writes vote records and can be used anonymously based on board settings, but it performs no nonce/origin check, leaving the action CSRFable  
... out of a total of 42 incidences.
Please, make sure that the nonce logic is correct. It's important to be cautious when structuring conditional checks around nonces.
includes/class-mcl-public.php:545 if (is_user_logged_in() && (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'mcl_ajax_nonce'))) {



## Data Must be Sanitized, Escaped, and Validated

When you include POST/GET/REQUEST/FILE calls in your plugin, it's important to sanitize, validate, and escape them. The goal here is to prevent a user from accidentally sending trash data through the system, as well as protecting them from potential security issues.

SANITIZE: Data that is input (either by a user or automatically) must be sanitized as soon as possible. This lessens the possibility of XSS vulnerabilities and MITM attacks where posted data is subverted.

VALIDATE: All data should be validated, no matter what. Even when you sanitize, remember that you don’t want someone putting in ‘dog’ when the only valid values are numbers.

ESCAPE: Data that is output must be escaped properly when it is echo'd, so it can't hijack admin screens. There are many esc_*() functions you can use to make sure you don't show people the wrong data.

To help you with this, WordPress comes with a number of sanitization and escaping functions. You can read about those here:

https://developer.wordpress.org/apis/security/sanitizing/
https://developer.wordpress.org/apis/security/escaping/

Remember: You must use the most appropriate functions for the context. If you’re sanitizing email, use sanitize_email(), if you’re outputting HTML, use wp_kses_post(), and so on.

An easy mantra here is this:

Sanitize early
Escape Late
Always Validate

Clean everything, check everything, escape everything, and never trust the users to always have input sane data. After all, users come from all walks of life.

Example(s) from your plugin:
includes/class-mcl-tour-admin.php:676 } elseif (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_ajax_nopriv_nonce')) {
# ✨ The nonce from POST is passed directly to wp_verify_nonce() without sanitization.
includes/class-mcl-tour-admin.php:743 } elseif (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_ajax_nopriv_nonce')) {
# ✨ The nonce from POST is passed directly to wp_verify_nonce() without sanitization.
includes/class-mcl-public.php:2922 $nonce = isset($_POST['nonce']) ? $_POST['nonce'] : '';
# ↳ Line 2926: if (!wp_verify_nonce($nonce, 'mcl_ajax_nonce')) {
# ↳ Line 2931: if (!wp_verify_nonce($nonce, 'mcl_ajax_nopriv_nonce')) {
# ✨ The nonce from POST is assigned raw and then used in wp_verify_nonce() without sanitization.
includes/class-mcl-tour-admin.php:737 if (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_tour_admin')) {
# ✨ The nonce from POST is passed directly to wp_verify_nonce() without sanitization.
includes/class-mcl-admin.php:1588 'provided_nonce' => $_POST['nonce'] ?? 'not set',
# ✨ The nonce value is returned in the JSON debug response without sanitization.
includes/class-mcl-admin-integration.php:29 if (!isset($_POST['mcl_nonce']) || !wp_verify_nonce($_POST['mcl_nonce'], 'mcl_save_publisher_checklist')) {
# ✨ The nonce from POST is passed directly to wp_verify_nonce() without sanitization.
includes/class-mcl-tour-admin.php:508 if (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_tour_admin')) {
includes/class-mcl-tour-public.php:556 $completed_tours = json_decode(stripslashes($_COOKIE['mcl_completed_tours']), true) ?: array();
# ↳ Line 561: setcookie('mcl_completed_tours', json_encode($completed_tours), time() + (30 * DAY_IN_SECONDS), COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
... out of a total of 75 incidences.


Note: $_SERVER, $_COOKIE and $_SESSION inputs must be sanitized as well.

Although this might be counterintuitive, some or all of its included data can be manipulated by the sender of the request. So it needs to be sanitized just like any other input.

Example(s) from your plugin:
includes/class-mcl-tour-public.php:133 if (isset($_SERVER['REQUEST_URI']) && preg_match('/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)(\?.*)?$/', $_SERVER['REQUEST_URI'])) {
includes/class-mcl-react-dev.php:919 $current_url = $protocol . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
includes/class-mcl-tour-public.php:651 return $_SERVER['REQUEST_URI'] ?? 'unknown';



Note: escape functions cannot be used to sanitize. They serve different purposes. Even if they seem to be perfect for this purpose, most of the functions are filterable and people expect to use them to escape. Therefore, another plugin may change what they do and make yours at risk and exploitable.

If you are trying to echo the variable, you have to first sanitize it and then escape it, as for example:
echo esc_html(sanitize_text_field($_POST['example']));
Example(s) from your plugin:
includes/class-mcl-admin-integration.php:190 esc_html(urldecode($_GET['error'])) . 



Note: When checking a nonce using wp_verify_nonce you will need to sanitize the input using wp_unslash AND sanitize_text_field, this is because this function is pluggable, and extenders should not trust its input values.

Example:
if ( ! isset( $_POST['magicc_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash ( $_POST['magicc_nonce'] ) ) , 'magicc_nonce' ) )

Example(s) from your plugin:
includes/class-mcl-tour-admin.php:741 } elseif (wp_verify_nonce($_POST['nonce'] ?? '', 'mcl_ajax_nonce')) {
includes/class-mcl-public.php:2661 if (!wp_verify_nonce($nonce, 'mcl_ajax_nopriv_nonce')) {
includes/class-mcl-public.php:2120 if (!wp_verify_nonce($_POST['nonce'], 'mcl_admin_nonce')) {
includes/class-mcl-public.php:3060 if (!wp_verify_nonce($nonce, 'mcl_ajax_nopriv_nonce')) {
... out of a total of 41 incidences.


Note: While the json_decode() function in PHP is useful for decoding JSON strings, it does not sanitize the input. Sanitization refers to the process of cleaning or filtering the input data to ensure that it is safe and secure to use.

The json_decode() function simply transforms a JSON string into a PHP array or object. Any potentially malicious data or scripts may persist after json_decode().
Example(s) from your plugin:
includes/class-mcl-public.php:2044 json_decode(stripslashes($_POST['items_in_progress']), true) : array();
includes/class-mcl-publisher-checklist.php:1107 $decoded = json_decode(stripslashes($_POST['post_types']), true);
includes/class-mcl-publisher-checklist.php:254 $tags = json_decode(stripslashes($_POST['tags'] ?? '[]'), true);
includes/class-mcl-public.php:1386 $items = json_decode(stripslashes($_POST['items']), true);
... out of a total of 23 incidences.

✔️ You can check this using Plugin Check.


## Generic function/class/define/namespace/option names

All plugins must have unique function names, namespaces, defines, class and option names. This prevents your plugin from conflicting with other plugins or themes. We need you to update your plugin to use more unique and distinct names.

A good way to do this is with a prefix. For example, if your plugin is called "MagicChecklists" then you could use names like these:
function magicc_save_post(){ ... }
class MAGICC_Admin { ... }
update_option( 'magicc_options', $options );
add_shortcode( 'magicc_shortcode', $callback );
register_setting( 'magicc_settings', 'magicc_user_id', ... );
define( 'MAGICC_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
global $magicc_options;
add_action('wp_ajax_magicc_save_data', ... );
namespace chrispump\magicchecklists;

Disclaimer: These are just examples that may have been self-generated from your plugin name, we trust you can find better options. If you have a good alternative, please use it instead, this is just an example.

The prefix should be at least four (4) characters long (don't try to use two- or three-letter prefixes anymore). We host almost 100,000 plugins on WordPress.org alone. There are tens of thousands more outside our servers. Believe us, you're likely to encounter conflicts.

You also need to avoid the use of __ (double underscores), wp_ , or _ (single underscore) as a prefix. Those are reserved for WordPress itself. You can use them inside your classes, but not as stand-alone function.

Please remember, if you're using _n() or __() for translation, that's fine. We're only talking about functions you've created for your plugin, not the core functions from WordPress. In fact, those core features are why you need to not use those prefixes in your own plugin! You don't want to break WordPress for your users.

Related to this, using if (!function_exists('NAME')) { around all your functions and classes sounds like a great idea until you realize the fatal flaw. If something else has a function with the same name and their code loads first, your plugin will break. Using if-exists should be reserved for shared libraries only.

Remember: Good prefix names are unique and distinct to your plugin. This will help you and the next person in debugging, as well as prevent conflicts.

Analysis result:
# This plugin is using the prefix "mcl" for 183 element(s).
# This plugin is using the prefix "magic" for 12 element(s).

# Using the common word "save" as a prefix.
includes/class-mcl-publisher-checklist.php:27 add_action('wp_ajax_save_publisher_checklist', array($this, 'ajax_save_publisher_checklist'));
# Using the common word "test" as a prefix.
includes/class-mcl-notification-manager.php:105 add_action('wp_ajax_test_mcl_deadlines', array($this, 'ajax_test_deadlines'));

# The prefix "mcl" is too short, we require prefixes to be over 4 characters.
includes/class-mcl-notification-ajax-manager.php:18 add_action('wp_ajax_mcl_test_notification_webhook', array($this, 'handle_test_webhook'));
includes/class-mcl-notification-ajax-manager.php:19 add_action('wp_ajax_mcl_test_email_notification', array($this, 'handle_test_email'));
includes/class-mcl-notification-ajax-manager.php:7 class MCL_Notification_Ajax_Handler
includes/class-mcl-rest-controller.php:432 set_transient($transient_key, 1, $this->rate_limit_period);
includes/class-mcl-rest-controller.php:452 set_transient($transient_key, $current_count + 1, $this->rate_limit_period);
includes/class-mcl-rest-controller.php:701 do_action('mcl_webhook_checklist_created', $post_id);
includes/class-mcl-rest-controller.php:755 do_action('mcl_webhook_checklist_updated', $post_id);
includes/class-mcl-rest-controller.php:792 do_action('mcl_webhook_checklist_deleted', $id);
includes/class-mcl-rest-controller.php:833 do_action('mcl_item_deleted', $id, $existing_item);
includes/class-mcl-rest-controller.php:869 do_action('mcl_item_added', $id, $new_item);
includes/class-mcl-rest-controller.php:2148 do_action('mcl_item_checked', $id, $item_id, true);
includes/class-mcl-rest-controller.php:2155 do_action('mcl_item_unchecked', $id, $item_id, false);
includes/class-mcl-rest-controller.php:7 class MCL_REST_Controller
includes/class-mcl-analytics.php:56 add_action('wp_ajax_mcl_track_view', array($this, 'track_view'));
includes/class-mcl-analytics.php:57 add_action('wp_ajax_nopriv_mcl_track_view', array($this, 'track_view'));
includes/class-mcl-analytics.php:59 add_action('wp_ajax_mcl_track_item_check', array($this, 'track_item_check'));
includes/class-mcl-analytics.php:60 add_action('wp_ajax_nopriv_mcl_track_item_check', array($this, 'track_item_check'));
includes/class-mcl-analytics.php:79 add_action('wp_ajax_mcl_get_comprehensive_analytics', array($this, 'ajax_get_comprehensive_analytics'));
includes/class-mcl-analytics.php:82 add_action('wp_ajax_mcl_cleanup_test_data', array($this, 'ajax_cleanup_test_data'));
includes/class-mcl-analytics.php:447 set_transient('mcl_approaching_deadlines', $approaching, HOUR_IN_SECONDS);
includes/class-mcl-analytics.php:13 class MCL_Analytics
includes/class-mcl-public.php:60 add_action('wp_ajax_mcl_update_checklist', array($this, 'update_checklist'));
includes/class-mcl-public.php:61 add_action('wp_ajax_nopriv_mcl_update_checklist', array($this, 'update_checklist'));
includes/class-mcl-public.php:62 add_action('wp_ajax_mcl_get_checklist', array($this, 'get_checklist'));
includes/class-mcl-public.php:63 add_action('wp_ajax_mcl_save_checked_state', array($this, 'save_checked_state'));
includes/class-mcl-public.php:66 add_action('wp_ajax_nopriv_mcl_get_checklist', array($this, 'get_checklist'));
includes/class-mcl-public.php:67 add_action('wp_ajax_nopriv_mcl_save_checked_state', array($this, 'save_checked_state'));
includes/class-mcl-public.php:68 add_action('wp_ajax_mcl_get_checked_state', array($this, 'ajax_get_checked_state'));
includes/class-mcl-public.php:69 add_action('wp_ajax_nopriv_mcl_get_checked_state', array($this, 'ajax_get_checked_state'));
includes/class-mcl-public.php:70 add_action('wp_ajax_mcl_add_item', array($this, 'add_item'));
includes/class-mcl-public.php:71 add_action('wp_ajax_nopriv_mcl_add_item', array($this, 'add_item'));
includes/class-mcl-public.php:72 add_action('wp_ajax_mcl_delete_item', array($this, 'delete_item'));
includes/class-mcl-public.php:73 add_action('wp_ajax_nopriv_mcl_delete_item', array($this, 'delete_item'));
includes/class-mcl-public.php:75 add_action('wp_ajax_mcl_release_lock', array($this, 'release_checklist_lock'));
includes/class-mcl-public.php:76 add_action('wp_ajax_nopriv_mcl_release_lock', array($this, 'release_checklist_lock'));
includes/class-mcl-public.php:77 add_action('wp_ajax_mcl_save_in_progress', array($this, 'save_in_progress_state'));
includes/class-mcl-public.php:78 add_action('wp_ajax_nopriv_mcl_save_in_progress', array($this, 'save_in_progress_state'));
includes/class-mcl-public.php:79 add_action('wp_ajax_mcl_get_in_progress_state', array($this, 'ajax_get_in_progress_state'));
includes/class-mcl-public.php:80 add_action('wp_ajax_nopriv_mcl_get_in_progress_state', array($this, 'ajax_get_in_progress_state'));
includes/class-mcl-public.php:81 add_action('wp_ajax_mcl_save_item_deadline', array($this, 'save_item_deadline'));
includes/class-mcl-public.php:82 add_action('wp_ajax_nopriv_mcl_save_item_deadline', array($this, 'save_item_deadline'));
includes/class-mcl-public.php:83 add_action('wp_ajax_mcl_clear_item_deadline', array($this, 'clear_item_deadline'));
includes/class-mcl-public.php:84 add_action('wp_ajax_nopriv_mcl_clear_item_deadline', array($this, 'clear_item_deadline'));
includes/class-mcl-public.php:85 add_action('wp_ajax_mcl_get_active_checklists_data', array($this, 'get_active_checklists_data'));
includes/class-mcl-public.php:86 add_action('wp_ajax_nopriv_mcl_get_active_checklists_data', array($this, 'get_active_checklists_data'));
includes/class-mcl-public.php:87 add_action('wp_ajax_mcl_get_kanban_board', array($this, 'get_kanban_board'), 5);
includes/class-mcl-public.php:88 add_action('wp_ajax_nopriv_mcl_get_kanban_board', array($this, 'get_kanban_board'), 5);
includes/class-mcl-public.php:89 add_action('wp_ajax_mcl_save_kanban_board', array($this, 'save_kanban_board'), 5);
includes/class-mcl-public.php:90 add_action('wp_ajax_nopriv_mcl_save_kanban_board', array($this, 'save_kanban_board'), 5);
includes/class-mcl-public.php:93 add_action('wp_ajax_mcl_get_threaded_comments', array($this, 'get_threaded_comments_public'), 5);
includes/class-mcl-public.php:94 add_action('wp_ajax_nopriv_mcl_get_threaded_comments', array($this, 'get_threaded_comments_public'), 5);
includes/class-mcl-public.php:95 add_action('wp_ajax_mcl_add_threaded_comment', array($this, 'add_threaded_comment_public'), 5);
includes/class-mcl-public.php:96 add_action('wp_ajax_nopriv_mcl_add_threaded_comment', array($this, 'add_threaded_comment_public'), 5);
includes/class-mcl-public.php:97 add_action('wp_ajax_mcl_delete_threaded_comment', array($this, 'delete_threaded_comment_public'), 5);
includes/class-mcl-public.php:98 add_action('wp_ajax_nopriv_mcl_delete_threaded_comment', array($this, 'delete_threaded_comment_public'), 5);
includes/class-mcl-public.php:99 add_action('wp_ajax_mcl_toggle_comment_like', array($this, 'toggle_comment_like_public'), 5);
includes/class-mcl-public.php:100 add_action('wp_ajax_nopriv_mcl_toggle_comment_like', array($this, 'toggle_comment_like_public'), 5);
includes/class-mcl-public.php:103 add_action('wp_ajax_mcl_toggle_item_upvote', array($this, 'toggle_item_upvote'), 5);
includes/class-mcl-public.php:104 add_action('wp_ajax_nopriv_mcl_toggle_item_upvote', array($this, 'toggle_item_upvote'), 5);
includes/class-mcl-public.php:105 add_action('wp_ajax_mcl_get_item_upvotes', array($this, 'get_item_upvotes'), 5);
includes/class-mcl-public.php:106 add_action('wp_ajax_nopriv_mcl_get_item_upvotes', array($this, 'get_item_upvotes'), 5);
includes/class-mcl-public.php:107 add_action('wp_ajax_mcl_submit_idea', array($this, 'submit_idea'), 5);
includes/class-mcl-public.php:108 add_action('wp_ajax_nopriv_mcl_submit_idea', array($this, 'submit_idea'), 5);
includes/class-mcl-public.php:109 add_action('wp_ajax_mcl_verify_email', array($this, 'verify_email'), 5);
includes/class-mcl-public.php:110 add_action('wp_ajax_nopriv_mcl_verify_email', array($this, 'verify_email'), 5);
includes/class-mcl-public.php:111 add_action('wp_ajax_mcl_get_feature_board_settings', array($this, 'get_feature_board_settings'), 5);
includes/class-mcl-public.php:112 add_action('wp_ajax_nopriv_mcl_get_feature_board_settings', array($this, 'get_feature_board_settings'), 5);
includes/class-mcl-public.php:113 add_action('wp_ajax_mcl_get_column_sync_settings', array($this, 'get_column_sync_settings_public'), 5);
includes/class-mcl-public.php:114 add_action('wp_ajax_nopriv_mcl_get_column_sync_settings', array($this, 'get_column_sync_settings_public'), 5);
includes/class-mcl-public.php:118 wp_schedule_event(time(), 'daily', 'mcl_cleanup_expired_ip_hashes');
includes/class-mcl-public.php:622 do_action('mcl_checklist_rendered', $checklist_id);
includes/class-mcl-public.php:1145 apply_filters('mcl_localized_data', $localized_data);
includes/class-mcl-public.php:1645 do_action('mcl_item_checked', $checklist_id, $item_id, true, $context);
includes/class-mcl-public.php:1651 do_action('mcl_item_unchecked', $checklist_id, $item_id, false, $context);
includes/class-mcl-public.php:2232 do_action('mcl_item_added', $checklist_id, $new_item);
includes/class-mcl-public.php:2279 do_action('mcl_item_deleted', $checklist_id, $deleted_item);
includes/class-mcl-public.php:7 class MCL_Public
includes/class-mcl-tutorial.php:26 add_action('wp_ajax_mcl_create_tutorial_checklist', array($this, 'ajax_create_tutorial_checklist'));
includes/class-mcl-tutorial.php:48 update_option('mcl_tutorial_checklist_created', '1');
includes/class-mcl-tutorial.php:231 update_option('mcl_tutorial_checklist_created', '1');
includes/class-mcl-tutorial.php:14 class MCL_Tutorial
includes/class-mcl-cpt.php:73 register_post_type('mcl_checklist', $args);
includes/class-mcl-cpt.php:100 register_taxonomy('mcl_tag', 'mcl_checklist', $args);
includes/class-mcl-cpt.php:7 class MCL_CPT
includes/class-mcl-api-integration.php:23 add_action('wp_ajax_mcl_test_webhook', array($this, 'handle_test_webhook'));
includes/class-mcl-api-integration.php:24 add_action('wp_ajax_mcl_clear_webhook_logs', array($this, 'handle_clear_webhook_logs'));
includes/class-mcl-api-integration.php:232 update_option('mcl_webhook_logs', $logs);
includes/class-mcl-api-integration.php:318 update_option('mcl_webhook_logs', array());
includes/class-mcl-api-integration.php:7 class MCL_API_Integration
includes/class-mcl-sanitization.php:7 class MCL_Sanitization
includes/class-mcl-image-handler.php:42 add_action('wp_ajax_mcl_upload_image', array($this, 'handle_upload'));
includes/class-mcl-image-handler.php:43 add_action('wp_ajax_nopriv_mcl_upload_image', array($this, 'handle_upload'));
includes/class-mcl-image-handler.php:44 add_action('wp_ajax_mcl_get_uploaded_images', array($this, 'get_uploaded_images'));
includes/class-mcl-image-handler.php:45 add_action('wp_ajax_nopriv_mcl_get_uploaded_images', array($this, 'get_uploaded_images'));
includes/class-mcl-image-handler.php:46 add_action('wp_ajax_mcl_get_account_images', array($this, 'get_account_images'));
includes/class-mcl-image-handler.php:47 add_action('wp_ajax_nopriv_mcl_get_account_images', array($this, 'get_account_images'));
includes/class-mcl-image-handler.php:6 class MCL_Image_Handler
includes/class-mcl-settings.php:31 add_action('wp_ajax_mcl_get_settings', array($this, 'ajax_get_settings'));
includes/class-mcl-settings.php:32 add_action('wp_ajax_mcl_save_settings', array($this, 'ajax_save_settings'));
includes/class-mcl-settings.php:33 add_action('wp_ajax_mcl_get_webhook_logs', array($this, 'ajax_get_webhook_logs'));
includes/class-mcl-settings.php:34 add_action('wp_ajax_mcl_test_webhook', array($this, 'ajax_test_webhook'));
includes/class-mcl-settings.php:35 add_action('wp_ajax_mcl_clear_webhook_logs', array($this, 'ajax_clear_webhook_logs'));
includes/class-mcl-settings.php:36 add_action('wp_ajax_mcl_get_available_languages', array($this, 'ajax_get_available_languages'));
includes/class-mcl-settings.php:39 add_action('wp_ajax_mcl_get_general_settings', array($this, 'ajax_get_general_settings'));
includes/class-mcl-settings.php:40 add_action('wp_ajax_nopriv_mcl_get_general_settings', array($this, 'ajax_get_general_settings'));
includes/class-mcl-settings.php:65 add_submenu_page('mcl_checklists', __('Settings', 'magic-checklists'), __('Settings', 'magic-checklists'), 'manage_options', 'mcl_settings', array($this, 'render_settings_page'));
includes/class-mcl-settings.php:76 register_setting('mcl_settings_group', $this->option_name, array('type' => 'array', 'sanitize_callback' => array($this, 'sanitize_settings')));
includes/class-mcl-settings.php:85 register_setting('mcl_integration_settings_group', $this->integration_option_name, array('type' => 'array', 'sanitize_callback' => array($this, 'sanitize_integration_settings')));
includes/class-mcl-settings.php:94 register_setting('mcl_dashboard_widget_settings_group', 'mcl_dashboard_widget_settings', array('type' => 'array', 'sanitize_callback' => array($this, 'sanitize_dashboard_widget_settings')));
includes/class-mcl-settings.php:1195 update_option($this->option_name, $sanitized);
includes/class-mcl-settings.php:1199 update_option($this->integration_option_name, $sanitized);
includes/class-mcl-settings.php:1213 update_option('mcl_dashboard_widget_settings', $sanitized);
includes/class-mcl-settings.php:6 class MCL_Settings
includes/class-mcl-global-notification-manager.php:32 wp_schedule_event(time(), 'daily', 'mcl_cleanup_global_notification_queue');
includes/class-mcl-global-notification-manager.php:40 wp_schedule_event(time(), 'fifteen_minutes', 'mcl_process_global_notifications');
includes/class-mcl-global-notification-manager.php:7 class MCL_Global_Notification_Manager
includes/class-mcl-dashboard-widget.php:20 add_action('wp_ajax_mcl_widget_toggle_checklist', array($this, 'ajax_toggle_checklist'));
includes/class-mcl-dashboard-widget.php:21 add_action('wp_ajax_mcl_widget_toggle_item', array($this, 'ajax_toggle_item'));
includes/class-mcl-dashboard-widget.php:62 wp_localize_script('mcl-dashboard-widget', 'mclDashboardWidget', array('ajaxurl' => admin_url('admin-ajax.php'), 'nonce' => wp_create_nonce('mcl_widget_nonce'), 'i18n' => array('confirmToggle' => __('Are you sure you want to toggle this checklist?', 'magic-checklists'), 'error' => __('An error occurred. Please try again.', 'magic-checklists'), 'activating' => __('Activating...', 'magic-checklists'), 'deactivating' => __('Deactivating...', 'magic-checklists'))));
includes/class-mcl-dashboard-widget.php:6 class MCL_Dashboard_Widget
includes/class-mcl-tour-public.php:14 add_action('wp_ajax_mcl_mark_tour_complete', array($this, 'mark_tour_complete'));
includes/class-mcl-tour-public.php:15 add_action('wp_ajax_nopriv_mcl_mark_tour_complete', array($this, 'mark_tour_complete'));
includes/class-mcl-tour-public.php:16 add_action('wp_ajax_mcl_get_tour_creator_ui', array($this, 'get_tour_creator_ui'));
includes/class-mcl-tour-public.php:298 define('MCL_TOUR_ASSETS_LOADED', true);
includes/class-mcl-tour-public.php:320 do_action('mcl_tour_assets_loading');
includes/class-mcl-tour-public.php:483 wp_localize_script($localize_handle, $localize_object_name, $localize_data);
includes/class-mcl-tour-public.php:7 class MCL_Tour_Public
includes/class-mcl-db-manager.php:6 class MCL_DB_Manager
includes/class-mcl-admin-integration.php:7 class MCL_Admin_Integration
includes/class-mcl-shortcode.php:141 do_action('mcl_checklist_rendered', $checklist_id);
includes/class-mcl-shortcode.php:7 class MCL_Shortcode
includes/class-mcl-permissions.php:7 class MCL_Permissions
includes/class-mcl-tour-cpt.php:45 register_post_type('mcl_tour', $args);
includes/class-mcl-tour-cpt.php:7 class MCL_Tour_CPT
includes/class-mcl-priority-utils.php:7 class MCL_Priority_Utils
includes/class-mcl-admin.php:22 add_action('wp_ajax_mcl_check_shortcut', array($this, 'check_shortcut'));
includes/class-mcl-admin.php:23 add_action('wp_ajax_mcl_toggle_active', array($this, 'toggle_active'));
includes/class-mcl-admin.php:25 add_action('wp_ajax_mcl_generate_invite', array($this, 'generate_invite_link'));
includes/class-mcl-admin.php:26 add_action('wp_ajax_mcl_get_invite_links', array($this, 'get_invite_links'));
includes/class-mcl-admin.php:27 add_action('wp_ajax_mcl_delete_invite_link', array($this, 'delete_invite_link'));
includes/class-mcl-admin.php:28 add_action('wp_ajax_mcl_update_invite_permission', array($this, 'update_invite_permission'));
includes/class-mcl-admin.php:29 add_action('wp_ajax_mcl_force_delete_lock', array($this, 'force_delete_lock'));
includes/class-mcl-admin.php:31 add_action('wp_ajax_mcl_get_checklists', array($this, 'get_checklists_data'));
includes/class-mcl-admin.php:32 add_action('wp_ajax_mcl_delete_checklist', array($this, 'ajax_delete_checklist'));
includes/class-mcl-admin.php:33 add_action('wp_ajax_mcl_clone_checklist', array($this, 'ajax_clone_checklist'));
includes/class-mcl-admin.php:34 add_action('wp_ajax_mcl_save_theme_mode', array($this, 'save_theme_mode'));
includes/class-mcl-admin.php:35 add_action('wp_ajax_mcl_get_checklist_for_edit', array($this, 'get_checklist_for_edit'), 10);
includes/class-mcl-admin.php:36 add_action('wp_ajax_mcl_get_users', array($this, 'get_users'), 10);
includes/class-mcl-admin.php:37 add_action('wp_ajax_mcl_get_roles', array($this, 'get_roles'), 10);
includes/class-mcl-admin.php:38 add_action('wp_ajax_mcl_get_admin_pages', array($this, 'get_admin_pages'), 10);
includes/class-mcl-admin.php:40 add_action('wp_ajax_mcl_get_kanban_board', array($this, 'get_kanban_board'));
includes/class-mcl-admin.php:41 add_action('wp_ajax_mcl_update_kanban_item', array($this, 'update_kanban_item'));
includes/class-mcl-admin.php:42 add_action('wp_ajax_mcl_update_kanban_columns', array($this, 'update_kanban_columns'));
includes/class-mcl-admin.php:43 add_action('wp_ajax_mcl_assign_kanban_user', array($this, 'assign_kanban_user'));
includes/class-mcl-admin.php:44 add_action('wp_ajax_mcl_set_kanban_due_date', array($this, 'set_kanban_due_date'));
includes/class-mcl-admin.php:47 add_action('wp_ajax_mcl_update_task_content', array($this, 'update_task_content'));
includes/class-mcl-admin.php:48 add_action('wp_ajax_mcl_get_task_comments', array($this, 'get_task_comments'));
includes/class-mcl-admin.php:49 add_action('wp_ajax_mcl_add_task_comment', array($this, 'add_task_comment'));
includes/class-mcl-admin.php:50 add_action('wp_ajax_mcl_update_task_comment', array($this, 'update_task_comment'));
includes/class-mcl-admin.php:51 add_action('wp_ajax_mcl_delete_task_comment', array($this, 'delete_task_comment'));
includes/class-mcl-admin.php:52 add_action('wp_ajax_mcl_save_task_comment', array($this, 'save_task_comment'));
includes/class-mcl-admin.php:55 add_action('wp_ajax_mcl_get_threaded_comments', array($this, 'get_threaded_comments'));
includes/class-mcl-admin.php:56 add_action('wp_ajax_nopriv_mcl_get_threaded_comments', array($this, 'get_threaded_comments'));
includes/class-mcl-admin.php:57 add_action('wp_ajax_mcl_add_threaded_comment', array($this, 'add_threaded_comment'));
includes/class-mcl-admin.php:58 add_action('wp_ajax_nopriv_mcl_add_threaded_comment', array($this, 'add_threaded_comment'));
includes/class-mcl-admin.php:59 add_action('wp_ajax_mcl_delete_threaded_comment', array($this, 'delete_threaded_comment'));
includes/class-mcl-admin.php:60 add_action('wp_ajax_mcl_toggle_comment_like', array($this, 'toggle_comment_like'));
includes/class-mcl-admin.php:61 add_action('wp_ajax_nopriv_mcl_toggle_comment_like', array($this, 'toggle_comment_like'));
includes/class-mcl-admin.php:64 add_action('wp_ajax_mcl_save_feature_board_settings', array($this, 'save_feature_board_settings'));
includes/class-mcl-admin.php:65 add_action('wp_ajax_mcl_get_feature_board_settings', array($this, 'get_feature_board_settings'));
includes/class-mcl-admin.php:66 add_action('wp_ajax_mcl_get_idea_submissions', array($this, 'get_idea_submissions'));
includes/class-mcl-admin.php:67 add_action('wp_ajax_mcl_approve_idea', array($this, 'approve_idea'));
includes/class-mcl-admin.php:68 add_action('wp_ajax_mcl_reject_idea', array($this, 'reject_idea'));
includes/class-mcl-admin.php:71 add_action('wp_ajax_mcl_get_column_sync_settings', array($this, 'get_column_sync_settings'));
includes/class-mcl-admin.php:72 add_action('wp_ajax_mcl_save_column_sync_settings', array($this, 'save_column_sync_settings'));
includes/class-mcl-admin.php:128 update_option('mcl_menu_position_notice', array('type' => 'adjustment', 'relative_to' => $relative_to, 'position' => $position, 'timestamp' => time()));
includes/class-mcl-admin.php:152 update_option('mcl_menu_position_notice', array('type' => 'fallback', 'timestamp' => time()));
includes/class-mcl-admin.php:499 wp_localize_script('jquery', 'mclAdminData', array('ajaxurl' => admin_url('admin-ajax.php'), 'ajax_url' => admin_url('admin-ajax.php'), 'nonces' => array('mcl_admin' => wp_create_nonce('mcl_admin'), 'mcl_ajax_nonce' => wp_create_nonce('mcl_ajax_nonce'), 'mcl_save_checklist' => wp_create_nonce('mcl_save_checklist'), 'mcl_toggle_active' => wp_create_nonce('mcl_toggle_active'), 'checkShortcut' => wp_create_nonce('mcl_check_shortcut_nonce'), 'inviteLinks' => wp_create_nonce($this->nonce_key), 'forceDeleteLock' => wp_create_nonce('mcl_force_delete_lock_nonce'), 'testWebhook' => wp_create_nonce('mcl_test_webhook'), 'pdfExport' => wp_create_nonce('mcl_save_pdf_settings'), 'mcl_save_theme_mode' => wp_create_nonce('mcl_save_theme_mode')), 'savedTheme' => get_user_meta(get_current_user_id(), 'mcl_theme', true) ?: '', 'currentChecklistId' => isset($_GET['checklist_id']) ? intval($_GET['checklist_id']) : 0, 'pluginUrl' => plugin_dir_url(dirname(__FILE__)) . '../', 'admin_url' => admin_url()));
includes/class-mcl-admin.php:522 add_action('wp_ajax_mcl_toggle_active', array($this, 'toggle_active'), 10);
includes/class-mcl-admin.php:523 add_action('wp_ajax_mcl_get_checklist_for_edit', array($this, 'get_checklist_for_edit'), 10);
includes/class-mcl-admin.php:524 add_action('wp_ajax_mcl_get_users', array($this, 'get_users'), 10);
includes/class-mcl-admin.php:525 add_action('wp_ajax_mcl_get_roles', array($this, 'get_roles'), 10);
includes/class-mcl-admin.php:526 add_action('wp_ajax_mcl_get_admin_pages', array($this, 'get_admin_pages'), 10);
includes/class-mcl-admin.php:1481 set_transient($transient_key, $prefilled_items, 60 * 15);
includes/class-mcl-admin.php:2753 update_option('mcl_settings', $individual_settings);
includes/class-mcl-admin.php:2757 update_option('mcl_settings_migrated_to_shared', true);
includes/class-mcl-admin.php:3745 do_action('mcl_comment_replied', $parent_id, $comment_id, $checklist_id, $item_id);
includes/class-mcl-admin.php:3748 do_action('mcl_comment_added', $checklist_id, $item_id, array('id' => $comment_id, 'content' => $comment_content));
includes/class-mcl-admin.php:3851 do_action('mcl_comment_liked', $comment_id, $comment->checklist_id, $comment->item_id);
includes/class-mcl-admin.php:492 $mcl_react_dev;
includes/class-mcl-admin.php:7 class MCL_Admin
includes/class-mcl-publisher-checklist.php:21 add_action('wp_ajax_mcl_check_publisher_requirements', array($this, 'ajax_check_requirements'));
includes/class-mcl-publisher-checklist.php:22 add_action('wp_ajax_mcl_save_publisher_checklist_state', array($this, 'ajax_save_checklist_state'));
includes/class-mcl-publisher-checklist.php:23 add_action('wp_ajax_mcl_get_publisher_checklist_data', array($this, 'ajax_get_publisher_checklist_data'));
includes/class-mcl-publisher-checklist.php:24 add_action('wp_ajax_mcl_get_meta_fields', array($this, 'ajax_get_meta_fields'));
includes/class-mcl-publisher-checklist.php:25 add_action('wp_ajax_mcl_get_requirement_definitions', array($this, 'ajax_get_requirement_definitions'));
includes/class-mcl-publisher-checklist.php:26 add_action('wp_ajax_mcl_get_post_types', array($this, 'ajax_get_post_types'));
includes/class-mcl-publisher-checklist.php:72 wp_localize_script('mcl-publisher-gutenberg', 'mclPublisher', array('ajaxurl' => admin_url('admin-ajax.php'), 'nonce' => wp_create_nonce('mcl_publisher_nonce'), 'debug' => defined('WP_DEBUG') && WP_DEBUG, 'i18n' => array('publisherChecklist' => __('Publisher Checklist', 'magic-checklists'), 'allRequirementsMet' => __('All requirements met!', 'magic-checklists'), 'requirementsNotMet' => __('Some requirements are not met', 'magic-checklists'), 'checking' => __('Checking...', 'magic-checklists'), 'error' => __('Error checking requirements', 'magic-checklists'), 'publishBlocked' => __('Publishing is blocked until all required items are completed.', 'magic-checklists'), 'requirements' => array('word_count' => __('Minimum Word Count', 'magic-checklists'), 'featured_image' => __('Featured Image', 'magic-checklists'), 'excerpt' => __('Excerpt', 'magic-checklists'), 'categories' => __('Minimum Categories', 'magic-checklists'), 'tags' => __('Minimum Tags', 'magic-checklists'), 'external_links' => __('External Links', 'magic-checklists'), 'internal_links' => __('Internal Links', 'magic-checklists'), 'title_length' => __('Title Length', 'magic-checklists'), 'meta_description' => __('Meta Description', 'magic-checklists'), 'meta_title' => __('Meta Title', 'magic-checklists'), 'image_alt_text' => __('Image Alt Text', 'magic-checklists'), 'heading_count' => __('Heading Count', 'magic-checklists'), 'image_count' => __('Image Count', 'magic-checklists'), 'custom_field' => __('Test Custom Field', 'magic-checklists'), 'custom_item' => __('Test custom Item', 'magic-checklists')), 'labels' => array('markAsComplete' => __('Mark as complete', 'magic-checklists'), 'allRequirementsMet' => __('All requirements met!', 'magic-checklists'), 'someRequiredItems' => __('Some required items need attention before publishing.', 'magic-checklists'), 'checkingRequirements' => __('Checking requirements...', 'magic-checklists'), 'lastChecked' => __('Last checked:', 'magic-checklists'), 'checkRequirements' => __('Check Requirements', 'magic-checklists'), 'required' => __('Required', 'magic-checklists'), 'manualVerificationComplete' => __('Manual verification complete', 'magic-checklists'), 'customItemVerificationRequired' => __('Custom item verification required', 'magic-checklists')), 'tips' => array('excerpt' => __('Excerpt helps users understand your content before reading. Check character limits in the excerpt section.', 'magic-checklists'), 'meta_description' => __('Meta descriptions appear in search results. Keep within SEO-recommended character limits.', 'magic-checklists'), 'heading_count' => __('Proper heading structure (H2, H3, H4) improves readability and SEO.', 'magic-checklists'), 'word_count' => __('Adequate content length helps with SEO and provides value to readers.', 'magic-checklists'), 'title_length' => __('Title length affects how it displays in search results and social media.', 'magic-checklists'), 'featured_image' => __('Featured images improve engagement and social media sharing.', 'magic-checklists'), 'categories' => __('Categories help organize your content and improve navigation.', 'magic-checklists'), 'tags' => __('Tags help readers discover related content and improve SEO.', 'magic-checklists'), 'external_links' => __('External links to authoritative sources add credibility to your content.', 'magic-checklists'), 'internal_links' => __('Internal links help readers explore related content and improve SEO.', 'magic-checklists'), 'image_alt_text' => __('Alt text makes images accessible to screen readers and improves SEO.', 'magic-checklists'), 'image_count' => __('Images make content more engaging and help break up text.', 'magic-checklists'), 'custom_field' => __('Custom fields store additional metadata for your content.', 'magic-checklists'), 'custom_item' => __('Manual verification items require human review before publishing.', 'magic-checklists')))));
includes/class-mcl-publisher-checklist.php:714 set_transient('mcl_publish_blocked_' . $post->ID, $blocking_issues, 300);
includes/class-mcl-publisher-checklist.php:7 class MCL_Publisher_Checklist
includes/class-mcl-theme-renderer.php:11 class MCL_Theme_Renderer
includes/class-mcl-tour-admin.php:13 add_action('wp_ajax_mcl_save_tour', array($this, 'save_tour'));
includes/class-mcl-tour-admin.php:14 add_action('wp_ajax_mcl_save_tour_settings', array($this, 'save_tour_settings'));
includes/class-mcl-tour-admin.php:15 add_action('wp_ajax_mcl_delete_tour', array($this, 'delete_tour'));
includes/class-mcl-tour-admin.php:16 add_action('wp_ajax_mcl_get_tour_data', array($this, 'get_tour_data'));
includes/class-mcl-tour-admin.php:17 add_action('wp_ajax_mcl_toggle_tour_status', array($this, 'toggle_tour_status'));
includes/class-mcl-tour-admin.php:18 add_action('wp_ajax_mcl_get_checklists_for_tour', array($this, 'get_checklists_for_tour'));
includes/class-mcl-tour-admin.php:19 add_action('wp_ajax_mcl_reset_tour_completion', array($this, 'reset_tour_completion'));
includes/class-mcl-tour-admin.php:20 add_action('wp_ajax_mcl_reorder_tour_steps', array($this, 'reorder_tour_steps'));
includes/class-mcl-tour-admin.php:21 add_action('wp_ajax_mcl_tour_step_check_item', array($this, 'tour_step_check_item'));
includes/class-mcl-tour-admin.php:22 add_action('wp_ajax_nopriv_mcl_tour_step_check_item', array($this, 'tour_step_check_item'));
includes/class-mcl-tour-admin.php:23 add_action('wp_ajax_mcl_get_item_tour_connections', array($this, 'get_item_tour_connections'));
includes/class-mcl-tour-admin.php:24 add_action('wp_ajax_nopriv_mcl_get_item_tour_connections', array($this, 'get_item_tour_connections'));
includes/class-mcl-tour-admin.php:27 add_action('wp_ajax_mcl_get_batch_tour_connections', array($this, 'get_batch_tour_connections'));
includes/class-mcl-tour-admin.php:28 add_action('wp_ajax_nopriv_mcl_get_batch_tour_connections', array($this, 'get_batch_tour_connections'));
includes/class-mcl-tour-admin.php:29 add_action('wp_ajax_mcl_has_active_tours', array($this, 'has_active_tours'));
includes/class-mcl-tour-admin.php:30 add_action('wp_ajax_nopriv_mcl_has_active_tours', array($this, 'has_active_tours'));
includes/class-mcl-tour-admin.php:33 add_action('wp_ajax_mcl_get_tours_list', array($this, 'get_tours_list'));
includes/class-mcl-tour-admin.php:34 add_action('wp_ajax_mcl_duplicate_tour', array($this, 'duplicate_tour'));
includes/class-mcl-tour-admin.php:35 add_action('wp_ajax_mcl_get_users_for_tour', array($this, 'get_users_for_tour'));
includes/class-mcl-tour-admin.php:36 add_action('wp_ajax_mcl_get_roles_for_tour', array($this, 'get_roles_for_tour'));
includes/class-mcl-tour-admin.php:40 add_submenu_page('mcl_checklists', __('Tours', 'magic-checklists'), __('Tours', 'magic-checklists'), 'manage_options', 'mcl_tours', array($this, 'render_tours_page'));
includes/class-mcl-tour-admin.php:72 wp_localize_script('driver-js', 'mclTourAdmin', array('ajax_url' => admin_url('admin-ajax.php'), 'nonce' => wp_create_nonce('mcl_tour_admin'), 'dashboard_url' => admin_url('index.php'), 'i18n' => array('save' => __('Save', 'magic-checklists'), 'cancel' => __('Cancel', 'magic-checklists'), 'delete' => __('Delete', 'magic-checklists'), 'confirmDelete' => __('Are you sure you want to delete this tour?', 'magic-checklists'), 'selectElement' => __('Select Element', 'magic-checklists'), 'navigate' => __('Navigate', 'magic-checklists'), 'addStep' => __('Add Step', 'magic-checklists'), 'stepTitle' => __('Step Title', 'magic-checklists'), 'stepContent' => __('Step Content', 'magic-checklists'), 'selectChecklist' => __('Select Checklist', 'magic-checklists'), 'selectItem' => __('Select Checklist Item', 'magic-checklists'), 'tourSaved' => __('Tour saved successfully', 'magic-checklists'), 'tourDeleted' => __('Tour deleted successfully', 'magic-checklists'), 'error' => __('An error occurred', 'magic-checklists'))));
includes/class-mcl-tour-admin.php:782 set_transient($cache_key, $has_tours ? 1 : 0, 5 * MINUTE_IN_SECONDS);
includes/class-mcl-tour-admin.php:7 class MCL_Tour_Admin
includes/class-mcl-notification-manager.php:37 wp_schedule_event(time(), 'daily', 'mcl_cleanup_notification_queue');
includes/class-mcl-notification-manager.php:88 wp_schedule_event(time(), 'fifteen_minutes', 'mcl_check_deadlines');
includes/class-mcl-notification-manager.php:109 wp_schedule_event(time(), 'fifteen_minutes', 'mcl_process_notifications');
includes/class-mcl-notification-manager.php:335 set_transient('mcl_force_deadline_check', $now, 10);
includes/class-mcl-notification-manager.php:356 set_transient('mcl_last_immediate_deadline_check', $now, 60);
includes/class-mcl-notification-manager.php:7 class MCL_Notification_Manager
includes/class-mcl-i18n.php:15 class MCL_I18n
includes/class-mcl-export-handler.php:20 add_action('wp_ajax_mcl_save_pdf_settings', array($this, 'save_pdf_settings'));
includes/class-mcl-export-handler.php:132 set_transient($test_transient, 'test', 60);
includes/class-mcl-export-handler.php:428 set_transient('mcl_test_' . time(), 'test', 300);
includes/class-mcl-export-handler.php:432 set_transient($export_id, $settings, 5 * MINUTE_IN_SECONDS);
includes/class-mcl-export-handler.php:6 class MCL_Export_Handler
includes/class-mcl-export-handler.php:450 class MCL_PDF_Generator
includes/class-mcl-react-dev.php:670 wp_localize_script($handle, 'mclAdminData', array('ajaxurl' => admin_url('admin-ajax.php'), 'restUrl' => rest_url('mcl/v1/'), 'nonces' => array('wp_rest' => wp_create_nonce('wp_rest'), 'mcl_admin' => wp_create_nonce('mcl_admin_nonce'), 'mcl_toggle_active' => wp_create_nonce('mcl_toggle_active'), 'mcl_save_theme_mode' => wp_create_nonce('mcl_save_theme_mode'), 'mcl_save_checklist' => wp_create_nonce('mcl_save_checklist'), 'checkShortcut' => wp_create_nonce('mcl_check_shortcut_nonce'), 'inviteLinks' => wp_create_nonce('mcl_invite_links_nonce'), 'testWebhook' => wp_create_nonce('mcl_test_webhook'), 'mcl_import_checklist' => wp_create_nonce('mcl_import_checklist'), 'mcl_import_json_checklist' => wp_create_nonce('mcl_import_json_checklist'), 'mcl_export_txt' => wp_create_nonce('mcl_export_txt'), 'mcl_export_json' => wp_create_nonce('mcl_export_json'), 'mcl_export_pdf' => wp_create_nonce('mcl_export_pdf'), 'mcl_save_pdf_settings' => wp_create_nonce('mcl_save_pdf_settings'), 'mcl_get_comprehensive_analytics' => wp_create_nonce('mcl_get_comprehensive_analytics'), 'mcl_cleanup_test_data' => wp_create_nonce('mcl_cleanup_test_data'), 'mcl_tour_admin' => wp_create_nonce('mcl_tour_admin'), 'mcl_kanban' => wp_create_nonce('mcl_admin_nonce')), 'currentUser' => wp_get_current_user()->ID, 'savedTheme' => get_user_meta(get_current_user_id(), 'mcl_theme', true), 'isAdmin' => is_admin(), 'isDev' => $this->is_dev_mode, 'pluginUrl' => MAGIC_CHECKLISTS_PLUGIN_URL, 'admin_url' => admin_url(), 'dashboard_url' => admin_url('index.php'), 'currentPage' => $current_page, 'pageParams' => $page_params, 'analytics' => $analytics_data, 'i18n' => $this->get_localization_data(), 'tutorialExists' => $this->check_tutorial_exists()));
includes/class-mcl-react-dev.php:798 wp_localize_script($handle, 'mclTourPlaybackData', $tour_data);
includes/class-mcl-react-dev.php:801 wp_localize_script($handle, 'mclPublicData', $public_data);
includes/class-mcl-react-dev.php:939 do_action('mcl_isolation_added_' . $public_handle);
includes/class-mcl-react-dev.php:1002 do_action('mcl_tour_isolation_added_' . $tour_handle);
includes/class-mcl-react-dev.php:107 $mcl_public_instance;
includes/class-mcl-react-dev.php:752 $mcl_public_instance;
includes/class-mcl-react-dev.php:1053 $mcl_public_instance;
includes/class-mcl-react-dev.php:17 class MCL_React_Dev
magicchecklists.php:233 update_option('mcl_settings', $settings);
magicchecklists.php:243 update_option('mcl_version', MAGIC_CHECKLISTS_VERSION);
magicchecklists.php:283 update_option('mcl_plugin_data_version', '1.2.1');
magicchecklists.php:151 $mcl_public_instance;
magicchecklists.php:165 $mcl_react_dev;

# Looks like there are elements not using common prefixes.
includes/class-mcl-notification-manager.php:116 add_action('wp_ajax_nopriv_heartbeat', array($this, 'check_immediate_deadlines'));
# ↳ Detected name: heartbeat
includes/class-mcl-notification-manager.php:117 add_action('wp_ajax_heartbeat', array($this, 'check_immediate_deadlines'));
# ↳ Detected name: heartbeat


👉 Continue with the review process.

Read this email thoroughly.

Please, take the time to fully understand the issues we've raised. Review the examples provided, read the relevant documentation, and research as needed. Our goal is for you to gain a clear understanding of the problems so you can address them effectively and avoid similar issues when maintaining your plugin in the future.
Note that there may be false positives - we are humans and make mistakes, we apologize if there is anything we have gotten wrong. If you have doubts you can ask us for clarification, when asking us please be clear, concise, direct and include an example.

📋 Complete your checklist.

✔️ I fixed all the issues in my plugin based on the feedback I received and my own review, as I know that the Plugins Team may not share all cases of the same issue. I am familiar with tools such as Plugin Check, PHPCS + WPCS, and similar utilities to help me identify problems in my code.
✔️ I tested my updated plugin on a clean WordPress installation with WP_DEBUG set to true.
⚠️ Do not skip this step. Testing is essential to make sure your fixes actually work and that you haven’t introduced new issues.

✔️ I acknowledge that this review will be rejected if I overlook the issues or fail to test my code.
✔️ I went to "Add your plugin" and uploaded the updated version. I can continue updating the code there throughout the review process — the team will always check the latest version.
✔️ I replied to this email. I was concise and shared any clarifications or important context that the team needed to know.
I didn't list all the changes, as the team will review the entire plugin again and that is not necessary at all.

ℹ️ To make this process as quick as possible and to avoid burden on the volunteers devoting their time to review this plugin's code, we ask you to thoroughly check all shared issues and fix them before sending the code back to us. I know we already asked you to do so, and it is because we are really trying to make it very clear.

Disclaimers

Please note that due to the significant effort this kind of reviews require, we do a basic review the first time that we review your plugin. Once the issues we shared above are fixed, we will do a more in-depth review which might surface other issues.

While we try to make our reviews as exhaustive as possible we, like you, are humans and may have missed things. We appreciate your patience and understanding.

We recommend that you get ahead of us by checking for some common issues that require a more thorough review such as the use of nonces or determining plugin and content directories correctly.

We encourage all plugin authors to use tools like Plugin Check to ensure that most basic issues are fixed first. If you haven't used it yet, give it a try, it will save us both time and speed up the review process.
Please note: Automated tools can give false positives, or may miss issues. Plugin Check and other tools cannot guarantee that our reviewers won't find an issue that needs fixing or clarification.

We again remind you that should you wish to alter your permalink (not the display name, the plugin slug) "magicchecklists", you must explicitly tell us what you would like it to be. Just changing the display name is not sufficient. We require you to clearly state, in the body of your email what your desired permalink is. Permalinks cannot be altered after approval, and we generally do not accept requests to rename them, should you fail to inform us during the review. If you previously asked for a permalink change and got a reply that is has been processed, you’re all good! While these emails will still use the original display name, you don’t need to panic. If you did not get a reply that we processed the permalink, let us know immediately.

If the corrections we requested in this initial review are not completed within 3 months (90 days), we will reject this submission in order to keep our queue manageable.

Review ID: F1 magicchecklists/chrispump/27Mar26/T1 27Mar26/3.9RC1 (P0TDX292706HGN)


---

## Changes Made (2026-03-31)

### 1. Ajax endpoint hardcoded path - FIXED
- Replaced `/wp-admin/admin-ajax.php` with `wp_make_link_relative(admin_url('admin-ajax.php'))` in `class-mcl-tour-public.php`

### 2. No publicly documented resource for generated/compressed content - FIXED
- Added `== Source Code ==` section to `readme.txt` linking to https://github.com/Kasoria/magicchecklists with build instructions

### 3. Use wp_enqueue commands (inline scripts/styles) - FIXED
- Converted all inline `<style>` and `<script>` tags to `wp_add_inline_style()`, `wp_add_inline_script()`, or `wp_localize_script()` in:
  - `class-mcl-settings.php` (4 instances)
  - `class-mcl-react-dev.php` (1 instance)
  - `class-mcl-admin.php` (2 instances)
  - `class-mcl-shortcode.php` (1 instance)
- Only exception: `class-mcl-export-handler.php` print page (standalone HTML output for PDF, not a WP admin page)

### 4. Undocumented use of 3rd party/external service - FIXED
- Added `== External Services ==` section to `readme.txt` documenting Slack and Discord webhook integrations with links to their Terms of Service and Privacy Policy

### 5. Calling core loading files directly - FIXED
- Removed unjustified `require_once(ABSPATH . 'wp-admin/includes/admin.php')` (2 instances in `class-mcl-admin.php`) - replaced with fallback logic
- Removed `require_once(ABSPATH . 'wp-admin/includes/screen.php')` in `class-mcl-admin.php` - removed the code block entirely
- Removed `require_once ABSPATH . 'wp-includes/class-phppdf.php'` in `class-mcl-export-handler.php` - replaced with `class_exists()` guard
- Kept justified uses: `upgrade.php` for `dbDelta()` and `plugin.php` with `function_exists('is_plugin_active')` guard (these are documented exceptions)

### 6. Determine files and directories locations correctly - FIXED
- Replaced all `WP_PLUGIN_DIR` usage with `MAGIC_CHECKLISTS_PLUGIN_PATH` constant (which uses `plugin_dir_path(__FILE__)`) in:
  - `magicchecklists.php`
  - `class-mcl-settings.php`

### 7. Please use WordPress' file uploader - FIXED
- Replaced `move_uploaded_file()` with `wp_handle_upload()` in `class-mcl-image-handler.php`

### 8. Check permission_callback in REST API Route - FIXED
- Removed public debug endpoint (`/magicchecklists/v2/debug`) that exposed API key metadata with `__return_true`
- `get_items_permissions_check`: changed from `is_user_logged_in()` to `current_user_can('edit_posts')`
- `get_item_permissions_check`: added post author check and `edit_others_posts` capability requirement
- Added checklist existence/type validation in `get_item_tour_connections()` in `class-mcl-tour-admin.php`

### 9. Text domain does not match plugin slug - FIXED
- Changed all 2146 occurrences of text domain `'magic-checklists'` to `'magicchecklists'` across all PHP files
- Updated plugin header `Text Domain: magicchecklists`
- Updated `MAGIC_CHECKLISTS_TEXT_DOMAIN` constant
- Renamed all language files from `magic-checklists-*.mo/po` to `magicchecklists-*.mo/po`

### 10. Nonces and User Permissions Needed for Security - FIXED
- Added nonce verification to AJAX handlers that were missing it:
  - `save_checked_state()` - added nopriv nonce check (was only checking for logged-in users)
  - `delete_item()` - added nonce check
  - `release_checklist_lock()` - added nonce check
  - `toggle_item_upvote()` - added nonce check
  - `ajax_test_deadlines()` - added `check_ajax_referer()` call
- Removed debug nonce value from JSON error response in `class-mcl-admin.php`

### 11. Data Must be Sanitized, Escaped, and Validated - FIXED
- All `wp_verify_nonce()` inputs wrapped with `sanitize_text_field(wp_unslash(...))` (~41 instances)
- All `$nonce = $_POST['nonce']` assignments sanitized
- `$_SERVER['REQUEST_URI']` and `$_SERVER['HTTP_HOST']` sanitized with `sanitize_text_field(wp_unslash())` / `esc_url_raw(wp_unslash())`
- `$_COOKIE` access sanitized with `sanitize_text_field(wp_unslash())`
- Replaced `stripslashes($_POST[...])` with `wp_unslash($_POST[...])` throughout
- `$_GET['error']` sanitized with `sanitize_text_field(wp_unslash())` before output
- `esc_html(urldecode(...))` pattern fixed to proper sanitize-then-escape

### 12. Generic function/class/define/namespace/option names - FIXED
- Renamed all `mcl_` prefix to `magiccl_` (6 chars) across:
  - ~1700 occurrences in 25 PHP files (AJAX actions, options, transients, hooks, post meta, DB tables, CSS IDs, nonce names)
  - ~428 occurrences in 33 JSX/JS source files
  - Renamed CSS/JS asset files from `mcl-*` to `magiccl-*`
  - Renamed JS global variables (`mclAdminData` -> `magicclAdminData`, etc.)
  - Renamed CSS classes (`mcl-drawer` -> `magiccl-drawer`, etc.)
  - Renamed REST namespace from `mcl/v1` to `magiccl/v1`
  - Renamed post types: `mcl_checklist` -> `magiccl_checklist`, `mcl_tour` -> `magiccl_tour`
  - Renamed taxonomy: `mcl_tag` -> `magiccl_tag`
- Fixed unprefixed AJAX actions: `save_publisher_checklist` -> `magiccl_save_publisher_checklist`, `test_mcl_deadlines` -> `magiccl_test_deadlines`
- `heartbeat` hooks are WordPress core hooks (false positives)
- Added DB migration code in `magicchecklists.php` to automatically migrate existing data from old `mcl_` prefix on upgrade
- PHP filenames (`class-mcl-*.php`) kept as-is (internal, not a prefix issue)

### Note
- The `dist/` directory needs to be rebuilt with `npm run build` since JS source files were updated with new prefix names