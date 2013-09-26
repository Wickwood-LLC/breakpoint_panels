(function($) {
  Drupal.behaviors.breakpoint_panels = {
    attach: function (context) {

      var that = this;
      $('#panels-ipe-customize-page').click(function(context){
        that.checkForEditing();
      });

      // Update cookies on each resize.
      $(window).resize(function() {
        that.onResize();
      });

      // Do a first manual cookie update to catch the current width.
      this.onResize();

      // For each AJAX pane check if it should be loaded and register enquire match.
      $('.bp-ajax-pane').each(function() {
        var element = $(this);
        var url = element.attr('data-src');
        that.checkForLoad(url, element);
      });
    },
    // Set the cookie with screen and browser width+ height.
    // Then check if we need to reload.
    onResize: function() {
      var date = new Date();
      date.setTime(date.getTime() + 30*24*60*60*1000);
      var expires = date.toGMTString();

      $window = $(window);

      var value = $window.width() + 'x' + $window.height()
        + '|' + screen.width + 'x' + screen.height;

      // Set cookie for screen resolution.
      document.cookie = 'breakpoints=' + value + '; expires=' + expires + '; path=/';

      if (this.width && this.height) {
        this.checkForReload($window.width(), $window.height());
      }
      this.width = $window.width();
      this.height = $window.height()
    },

    checkForReload: function(curWidth, curHeight) {
      if (!('breakpoint_panels_breakpoint' in Drupal.settings) || !(Drupal.settings.breakpoint_panels_breakpoint.autoload)) {
        return;
      }
      var settings = Drupal.settings.breakpoint_panels_breakpoint;
      var $window = $(window);
      for (var key in settings) {
        for (var cmd in settings[key]) {
          var value = settings[key][cmd];
          // If the result changes, the condition has changed, so we need
          // to reload.
          var now = this.checkCondition(cmd, $window.width(), $window.height(), value);
          var before = this.checkCondition(cmd, this.width, this.height, value);

          if (now !== before) {
            window.location.reload(true);

            // FF prevents reload in onRsize event, so we need to do it
            // in a timeout. See issue #1859058
            if ('mozilla' in $.browser)  {
              setTimeout(function() {
                window.location.reload(true);
              }, 10);
            }
            return;
          }
        }
      }
    },

    checkCondition: function(condition, width, height, value) {
      var flag = null;

      switch (condition) {
        case 'width':
          flag = width === value;
          break;

        case 'min-width':
          flag = width >= value;
          break;

        case 'max-width':
          flag = width <= value;
          break;

        case 'height':
          flag = height === value;
          break;

        case 'min-height':
          flag = height >= value;
          break;

        case 'max-height':
          flag = height <= value;
          break;

        case 'aspect-ratio':
          flag = width / height === value;
          break;

        case 'min-aspect-ratio':
          flag = width / height >= value;
          break;

        case 'max-aspect-ratio':
          flag = width / height <= value;
          break;

        default:
          break;
      }

      return flag;
    },
    checkForLoad: function(url, element) {
      /**
       * Checks if a pane should be loaded given the current screen size.
       */
      var settings = Drupal.settings.breakpoint_panels_breakpoint;
      var parent_el = element.parent();
      var this_shown = false;
      if (settings['breakpoints'] != 'undefined') {
        for (var key in settings['breakpoints']) {
          var cur_bp = settings['breakpoints'][key];
          if (
            !parent_el.hasClass('hide-' + cur_bp['css'])
            || settings['loadhidden']
            || (settings['adminload'] && settings['isloggedin'])
          ) {
            if (settings['hasEnquire']) {
              var that = this;
              enquire.register(cur_bp['bp'], {
                match: function() {
                  that.fetch_pane(url, element);
                  element.closest('.panel-pane').show();
                },
                unmatch: function() {
                  // Hide closest ancestor of class panel-pane to make sure any styles.
                  // applied to the pane are also hidden.
                  element.closest('.panel-pane').hide();
                }
              });
            }
            else {
              // Fallback psuedo-gracefully if enquire was not found.
              this.fetch_pane(url, element);
            }
          }
          else {
            if (settings['hasEnquire']) {
              enquire.register(cur_bp['bp'], {
                match: function() {
                  element.closest('.panel-pane').hide();
                },
                unmatch: function() {
                  element.closest('.panel-pane').show();
                }
              });
            }
          }
        }
      }
    },
    checkForEditing: function (x) {
      // check if save button is there
      x = (x) ? x :0;
      var that = this;
      if ($('#panels-ipe-save').length<1) {
        //nope, wait more
        x++;
        if(x<10) {
          setTimeout(function(){that.checkForEditing(x);},500);
        }
        return;
      }
      // do stuff to the save bar
      var settings = Drupal.settings.breakpoint_panels_breakpoint;
      var $window = $(window);
      var sizes = {};
      for (var key in settings) {
        keys = key.split('.');
        if (keys.length>1) {
          sizes[keys[2]] = settings[key];
        }
        for (var cmd in settings[key]) {

        }
      }

      if($('.toggleResponsive').length<1) {
        $('#panels-ipe-edit-control-form div').prepend("<div class='toggleResponsive icon-large icon-eye-open'>Toggle Responsive</div>");
        $('.toggleResponsive').click(function(){
          if(!$(this).hasClass('active')) {
            for (size in sizes) {
              var bp = sizes[size].bp;
              var css = sizes[size].css;
              if (settings.hasEnquire == true) {
                eval("enquire.register(bp, { match : function() { $('." + css + "').parent().parent().hide();}, unmatch : function() { $('." + css + "').parent().parent().show(); }, });");
              }
            }
            $(this).addClass('active icon-eye-close');
            $(this).removeClass('icon-eye-open');
            $('.panels-ipe-editing').addClass('hide-responsive');
          } else {
            for (size in sizes) {
              $('.' + sizes[size].css).show();
              if (settings.hasEnquire == true) {
                enquire.unregister(sizes[size].bp);
              }
            }
            $(this).removeClass('active icon-eye-close');
            $(this).addClass('icon-eye-open');
            $('.panels-ipe-editing').removeClass('hide-responsive');
          }
          if (settings.hasEnquire == true) {
            enquire.listen();
            //enquire.fire();// enquire.fire(); // Enquire doesn't seem to have this method.
          }
        });
      }
    },
    fetch_pane: function(url, element) {
      /**
       * Does an AJAX request for the pane contents if it has not yet been loaded.
       */
      if (!element.hasClass('processed')) {
        $.ajax({
          url: url,
          type: 'GET',
          dataType: 'html',
          success: function (response) {
            // Swap out the contents of the placeholder with the actual pane contents.
            element.replaceWith(response);
            // Flag as processed so that it will not load again.
            element.addClass('processed');
          }
        });
      }
    }
  };

})(jQuery);
