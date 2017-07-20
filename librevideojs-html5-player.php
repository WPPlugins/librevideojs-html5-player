<?php
/*
Plugin Name: LibreVideoJS HTML5 Player
Version: 1.2.2
Plugin URI: https://wordpress.org/plugins/librevideojs-html5-player
Author: <a href="https://conocimientoslibres.tuxfamily.org">Jesús Eduardo</a>, <a href="http://www.freakspot.net/">Jorge Maldonado</a>
Description: Reproductor de vídeo Libre en Responsive Desing HTML5 para WordPress, construido sobre el ampliamente utilizado <a href="https://notabug.org/Heckyel/LibreVideoJS">LibreVideoJS</a> de la biblioteca del reproductor de vídeo HTML5. Le permite incrustar vídeo en tu post o página con HTML5 para los navegadores principales. Es compatible con <a href="https://www.gnu.org/software/librejs/free-your-javascript.html">LibreJS</a> de acuerdo con la filosofía <a href="https://www.gnu.org">GNU</a>.
Text Domain: librevideojs-html5-player
License: GPLv3 or later
Domain Path: /languages
*/

if (!defined('ABSPATH')){
    exit;
}

include_once 'GWP_bs3_panel_shortcode.php';

if (!class_exists('LIBREVIDEOJS_HTML5_PLAYER')){

    class LIBREVIDEOJS_HTML5_PLAYER{

        var $plugin_version = '1.2.2';

        function __construct(){
            define('L_VERSION', $this->plugin_version);
            $this->plugin_includes();
        }

        function plugin_includes(){
            if (is_admin()){
                add_filter('plugin_action_links', array($this, 'plugin_action_links'), 10, 2);
            }
            add_action('plugins_loaded', array($this, 'plugins_loaded_handler'));
            add_action('wp_enqueue_scripts', 'librevideojs_html5_player_enqueue_scripts');
            add_action('admin_menu', array($this, 'add_options_menu'));
            add_shortcode('librevideojs_video', 'librevideojs_html5_video_embed_handler');
            //allows shortcode execution in the widget, excerpt and content
            add_filter('widget_text', 'do_shortcode');
            add_filter('the_excerpt', 'do_shortcode', 11);
            add_filter('the_content', 'do_shortcode', 11);
        }

        function plugin_url(){
            if ($this->plugin_url)
                return $this->plugin_url;
            return $this->plugin_url = plugins_url(basename(plugin_dir_path(__FILE__)), basename(__FILE__));
        }

        function plugin_action_links($links, $file){
            if ($file == plugin_basename(dirname(__FILE__) . '/librevideojs-html5-player.php')){
                $links[] = '<a href="options-general.php?page=librevideojs-html5-player-settings">'.__('Settings', 'librevideojs-html5-player').'</a>';
            }
            return $links;
        }

        function plugins_loaded_handler()
        {
            load_plugin_textdomain('librevideojs-html5-player', false, dirname( plugin_basename( __FILE__ )) . '/languages/');
        }

        function add_options_menu(){
            if (is_admin()){
                add_options_page(__('LibreVideoJS Settings', 'librevideojs-html5-player'), __('LibreVideoJS HTML5 Player', 'librevideojs-html5-player'), 'manage_options', 'librevideojs-html5-player-settings', array($this, 'options_page'));
            }
        }

        function options_page(){
            $url = "https://wordpress.org/plugins/librevideojs-html5-player";
            $link_text = sprintf(wp_kses(__('For detailed documentation please visit the plugin homepage <a target="_blank" href="%s">here</a>.', 'librevideojs-html5-player'), array('a' => array('href' => array(), 'target' => array()))), esc_url($url));
            printf(
            '<div class="wrap"><h2>LibreVideoJS HTML5 Player - v ' . $this->plugin_version . '</h2>
                <div class="update-nag">' . $link_text . '</div>
            </div>');
        }
    }

    $GLOBALS['easy_video_player'] = new LIBREVIDEOJS_HTML5_PLAYER();
    new GWP_bs3_panel_shortcode();

}

function librevideojs_html5_player_enqueue_scripts(){
    global $post, $plugin_url;
    $plugin_url = plugins_url('', __FILE__);
    if ( is_home() || is_archive() || is_category() || is_tag() ){
        wp_enqueue_style('lvjs-mix-master', $plugin_url . '/librevideojs/css/mix-material/master.css', array(), '1.4');
        wp_enqueue_style('lvjs-material', $plugin_url . '/librevideojs/css/material/master.css', array(), '1.4.1');
        wp_enqueue_style('lvjs-selector', $plugin_url . '/librevideojs/css/quality-selector.css', array(), '1.4.1');
        wp_enqueue_script('lvjs', $plugin_url . '/librevideojs/js/cliplibrejs.dev.js', array(), L_VERSION);
    } else if ( ( is_author() || is_page() || is_single() ) && strpos($post->post_content, '[librevideojs_video') !== false ){
        wp_enqueue_style('lvjs-mix-master', $plugin_url . '/librevideojs/css/mix-material/master.css', array(), '1.4');
        wp_enqueue_style('lvjs-material', $plugin_url . '/librevideojs/css/material/master.css', array(), '1.4.1');
        wp_enqueue_style('lvjs-selector', $plugin_url . '/librevideojs/css/quality-selector.css', array(), '1.4.1');
        wp_enqueue_script('lvjs', $plugin_url . '/librevideojs/js/cliplibrejs.dev.js', array(), L_VERSION);
    } else {
        return false;
    }
}

function librevideojs_html5_video_embed_handler($atts, $content=null){
    extract(shortcode_atts(array(
        'url' => '',
        'url_calidad' => '',
        'code' => '',
        'selector' => '',
        'width' => '',
        'controls' => '',
        'preload' => 'auto',
        'autoplay' => 'false',
        'loop' => '',
        'muted' => '',
        'poster' => '',
        'skin' => '',
        'class' => '',
    ), $atts));

    if(empty($url)){
        return __('you need to specify the src of the video file', 'librevideojs-html5-player');
    }
    //src
    $src = '<source data-res="'.$url_calidad.'" src="'.$url.'" type="video/'.$code.'"/>';

    //resolution selector
    if(!empty($selector)){
        $resolution = "$selector";
    }
    else {
        $resolution = "$url_calidad";
    }

    //controls
    if($controls == "false"){
        $controls = "";
    }
    else{
        $controls = " controls";
    }

    //preload
    if($preload == "metadata"){
        $preload = ' preload="metadata"';
    }
    else if($preload == "none"){
        $preload = ' preload="none"';
    }
    else{
        $preload = ' preload="auto"';
    }

    //autoplay
    if($autoplay == "true"){
        $autoplay = " autoplay";
    }
    else{
        $autoplay = "";
    }

    //loop
    if($loop == "true"){
        $loop = " loop";
    }
    else{
        $loop = "";
    }

    //muted
    if($muted == "true"){
        $muted = " muted";
    }
    else{
        $muted = "";
    }

    //Tracks
    if(!is_null( $content )){
        $track = do_shortcode($content);
    }
    else{
        $track = "";
    }

    //Qualities
    if(!is_null( $content = '' )){
        $calidades = do_shortcode($content);
    }
    else{
        $calidades = "";
    }

    //skin theme
    if(!empty($skin)){
        $_skin = "$skin";
    }
    else{
        $_skin= "materialteal";
    }

    //poster
    if(!empty($poster)){
        $poster = " poster='$poster'";
    }
    $player = "librevideojs" . uniqid();

    //languages
    $_no_html5 = __('Sorry, this video will not work because your web browser does not support HTML5 video. Please, change or update your browser', 'librevideojs-html5-player');

    $_no_browser = '<p class="no_html5">' . $_no_html5 . '</p>';

    //custom style
    $style = '';
    if(!empty($width)){
        $style = <<<EOT
        <style>
        $player {
            max-width:{$width}px;
        }
        </style>
EOT;

    }
    $output = <<<EOT
    <div class="LibreVideoJS">
    <video id="$player" class="cliplibre-js-responsive-container librevjs-hd cliplibre-js librevjs-libre-{$_skin}-skin" {$controls}{$preload}{$autoplay}{$loop}{$muted}{$poster} data-setup='{}'>
        {$src}\n\t\t{$calidades}{$track}{$_no_browser}
    </video>
    </div>
    <script>
    // @license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3-or-Later
    cliplibrejs('$player',{plugins:{resolutionSelector:{force_types:['video/webm','video/ogg','video/mp4'],default_res:"$resolution"}},nativeControlsForTouch: false});
    // @license-end
    </script>
    <script>
    // @license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3-or-Later
    cliplibrejs('$player').ready(function(){this.hotkeys({volumeStep: 0.1,seekStep: 5,enableMute: true,enableFullscreen: true,enableNumbers: true});});
    // @license-end
    </script>
    $style
EOT;
    return $output;
}

/*Adding subtitles using... [track]*/
function track_shortcode($atts, $content=null){
    extract(shortcode_atts(array(
        'kind' => '',
        'subt' => '',
        'srclang' => '',
        'label' => '',
        'default' => '',
    ), $atts));

    if($kind){
        $kind = " kind='$kind'";
    }

    if($subt){
        $subt = " src='$subt'";
    }

    if($srclang){
        $srclang = " srclang='$srclang'";
    }

    if($label){
        $label = " label='$label'";
    }

    if($default == "true" || $default == "default"){
        $default = " default";
    }
    else{
        $default = "";
    }

    $track = "<track" . $kind . $subt . $srclang . $label . $default . "/>\n\t\t";

    return $track;
}
add_shortcode('track', 'track_shortcode');

/*Adding qualities*/
function calidades_shortcode($atts, $content=null){
    extract(shortcode_atts(array(
        'lvjs_calidad' => '',
        'src_video' => '',
        'lvjs_code' => '',
    ), $atts));

    if($lvjs_calidad){
        $lvjs_calidad = " data-res='$lvjs_calidad'";
    }

    if($src_video){
        $src_video = " src='$src_video'";
    }

    $calidades = "<source" . $lvjs_calidad . $src_video . " type='video/".$lvjs_code."'/>\n\t\t";

    return $calidades;
}
add_shortcode('calidades', 'calidades_shortcode');
