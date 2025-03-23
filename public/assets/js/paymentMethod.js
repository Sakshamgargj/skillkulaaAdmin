jQuery(document).ready(function() {
    
    // paypal method 
    if(jQuery('input[name=paypal_mode]:checked').val() == 'testMode'){
            jQuery('.paypal-live-mode').hide();
            jQuery('.paypal-test-mode').attr('style',"display: block");
        }
    if(jQuery('input[name=paypal_mode]:checked').val() == 'liveMode'){
        jQuery('.paypal-test-mode').hide();
        jQuery('.paypal-live-mode').attr('style',"display: block");
    }

    jQuery('input[name=paypal_mode]').change(function(){
        if(jQuery(this).val()=='testMode'){        
            jQuery('.paypal-test-mode').show();
            jQuery('.paypal-live-mode').attr('style',"display: none!important");
        };
        if(jQuery(this).val()=='liveMode'){        
            jQuery('.paypal-test-mode').attr('style',"display: none!important");
            jQuery('.paypal-live-mode').show();
        };
    });


    
    // stripe method
    if(jQuery('input[name=stripe_mode]:checked').val() == 'testMode'){
            jQuery('.stripe-live-mode').hide();
            jQuery('.stripe-test-mode').attr('style',"display: block");
        }
    if(jQuery('input[name=stripe_mode]:checked').val() == 'liveMode'){
        jQuery('.stripe-test-mode').hide();
        jQuery('.stripe-live-mode').attr('style',"display: block");
    }

    jQuery('input[name=stripe_mode]').change(function(){
        if(jQuery(this).val()=='testMode'){        
            jQuery('.stripe-test-mode').show();
            jQuery('.stripe-live-mode').attr('style',"display: none!important");
        };
        if(jQuery(this).val()=='liveMode'){        
            jQuery('.stripe-test-mode').attr('style',"display: none!important");
            jQuery('.stripe-live-mode').show();
        };
    });


    // razorpay method
    if(jQuery('input[name=razorpay_mode]:checked').val() == 'testMode'){
            jQuery('.razorpay-live-mode').hide();
            jQuery('.razorpay-test-mode').attr('style',"display: block");
        }
    if(jQuery('input[name=razorpay_mode]:checked').val() == 'liveMode'){
        jQuery('.razorpay-test-mode').hide();
        jQuery('.razorpay-live-mode').attr('style',"display: block");
    }

    jQuery('input[name=razorpay_mode]').change(function(){
        if(jQuery(this).val()=='testMode'){        
            jQuery('.razorpay-test-mode').show();
            jQuery('.razorpay-live-mode').attr('style',"display: none!important");
        };
        if(jQuery(this).val()=='liveMode'){        
            jQuery('.razorpay-test-mode').attr('style',"display: none!important");
            jQuery('.razorpay-live-mode').show();
        };
    });

});