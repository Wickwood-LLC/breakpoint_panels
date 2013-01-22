<?php
/**
 * @file
 * Definition of a collapsible panel pane.
 */

// Plugin definition
$plugin = array(
  'title' => t('Breakpoint Panel'),
  'description' => t('Display a pane that is shown only for certain breakpoints'),
  'render pane' => 'breakpoint_panels_breakpoint_pane_style_render_pane',
  'pane settings form' => 'breakpoint_panels_breakpoint_pane_settings_form',
);

/**
 * Render callback.
 *
 * @ingroup themeable
 */
function theme_breakpoint_panels_breakpoint_pane_style_render_pane($vars) {
  if ($path = libraries_get_path('enquire.js')) {
    drupal_add_js($path . '/enquire.min.js');
  }
  if ($path = libraries_get_path('matchMedia.js')) {
    drupal_add_js($path . '/matchMedia.js');
  }
  drupal_add_js(drupal_get_path('module', 'breakpoint_panels') . '/js/breakpoint_pane.js');
  $content = $vars['content'];
  $pane = $vars['pane'];
  $display = $vars['display'];
  $settings = $vars['settings'];

  if (empty($content->content)) {
    return;
  }
  $bps = breakpoints_breakpoint_load_all_active();
  $ipemessage = "";
  $hides = array();
  $css = "";
  foreach ($bps as $name => $bp) {
    $clean = drupal_clean_css_identifier($bp->name);
    if (empty($settings['pane_' . $clean])) {
      array_push($hides, 'hide_' . $clean);
      $ipemessage .= '<br />Hidden from ' . $bp->name;
    }
    $css .= "@media " . $bp->breakpoint . " { " . '.hide_' . $clean . " { display:none } }\n .panels-ipe-editing " . '.hide_' . $clean . " { display:block }\n";
  }
  drupal_add_css($css, array('group' => CSS_DEFAULT, 'type' => 'inline'));
  $ipemessage .= (!empty($ipemessage)) ? '<br /><br />' : '';

  $themed = theme('panels_pane', array('content' => $content, 'pane' => $pane, 'display' => $display));
  $classes= "";
  foreach ($hides as $hide) {
    $classes .= ' ' . $hide;
  }
  $output = "<div class='$classes'>";$output .= '<div class="ipemessage">' . $ipemessage . '</div>';
  $output .= $themed;
  $output .= '</div>';
  drupal_add_css(drupal_get_path('module', 'breakpoint_panels') . '/plugins/styles/breakpoint_pane/breakpoint_pane.css', array('type' => 'file', 'media' => 'screen'));
  return $output;
}

/**
 * Settings form callback.
 */
function breakpoint_panels_breakpoint_pane_settings_form($style_settings) {
  $form = array();
  $bps = breakpoints_breakpoint_load_all_active();
  foreach ($bps as $name => $bp) {
    $form['pane_' . drupal_clean_css_identifier($bp->name)] = array(
      '#type' => 'checkbox',
      '#title' => filter_xss(t('Display ' . $bp->name)),
      '#default_value' => (isset($style_settings['pane_' . $name])) ? $style_settings['pane_' . $name] : TRUE
    );
  }

  return $form;
}
