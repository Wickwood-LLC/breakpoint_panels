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

      $('.bp-ajax-pane').once('bp-ajax-pane-processed', function() {
        var element = $(this);
        var url = element.attr('src');
        that.checkForLoad(url, element);
      });
      if (Drupal.settings.breakpoint_panels_breakpoint.hasEnquire == true) {
        enquire.fire();
      }
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
      var settings = Drupal.settings.breakpoint_panels_breakpoint;
      var $window = $(window);
      for (var key in settings) {
        for (var cmd in settings[key]) {
          var value = settings[key][cmd];
          // If the result changes, the condition has changed, so we need
          // to reload.
          if(
            // Show if it doesn't have the hide class
            (cmd=='bp' && !element.hasClass(settings[key]['css']))
            // Show if load hidden pref is checked
            || settings['loadhidden']
            //  Show if the 'load for admins' and they are logged in
            || (settings['adminload'] && settings['isloggedin'])) {
            if (settings.hasEnquire == true) {
              enquire.register(
                value,
                {
                match : function() {
                  breakpoint_panels_fetch_pane(element, url);
                },
              });
            }
            else {
              breakpoint_panels_fetch_pane(element, url);
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
              eval("enquire.register(bp, { match : function() { $('." + css + "').parent().parent().hide();}, unmatch : function() { $('." + css + "').parent().parent().show(); }, });");
            }
            $(this).addClass('active icon-eye-close');
            $(this).removeClass('icon-eye-open');
            $('.panels-ipe-editing').addClass('hide-responsive');
          } else {
            for (size in sizes) {
              $('.' + sizes[size].css).show();
              enquire.unregister(sizes[size].bp);
            }
            $(this).removeClass('active icon-eye-close');
            $(this).addClass('icon-eye-open');
            $('.panels-ipe-editing').removeClass('hide-responsive');
          }
          if (Drupal.settings.breakpoint_panels_breakpoint.hasEnquire == true) {
            enquire.listen();
            enquire.fire();
          }
        });
      }
    },
  };

  /**
   * Fetches the contents of a pane and replaces an element with them.
   */
  function breakpoint_panels_fetch_pane(element, url) {
    element.once('ajax-loaded',function() {
      $.ajax({
        url: url,
        type: 'GET',
        dataType: 'html',
        success: function (response) {
          element.replaceWith(response);
        }
      });
    });
  }

})(jQuery);
