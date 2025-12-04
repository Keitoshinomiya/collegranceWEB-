// Contact Form JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');
    const btnText = submitBtn.querySelector('.btn-text');
    const loadingSpinner = submitBtn.querySelector('.loading-spinner');
    
    // Form validation rules
    const validationRules = {
        name: {
            required: true,
            minLength: 2,
            message: 'お名前は2文字以上で入力してください'
        },
        email: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: '有効なメールアドレスを入力してください'
        },
        phone: {
            pattern: /^[\d\-\(\)\+\s]+$/,
            message: '有効な電話番号を入力してください'
        },
        subject: {
            required: true,
            message: 'お問い合わせの種類を選択してください'
        },
        message: {
            required: true,
            minLength: 10,
            message: 'お問い合わせ内容は10文字以上で入力してください'
        },
        privacy: {
            required: true,
            message: 'プライバシーポリシーに同意してください'
        }
    };
    
    // Real-time validation
    Object.keys(validationRules).forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (field) {
            field.addEventListener('blur', () => validateField(fieldName));
            field.addEventListener('input', () => clearError(fieldName));
        }
    });

    // Order Number Toggle Logic
    const subjectSelect = document.getElementById('subject');
    const orderNumberGroup = document.getElementById('orderNumberGroup');
    const orderNumberInput = document.getElementById('order_number');

    if (subjectSelect && orderNumberGroup) {
        subjectSelect.addEventListener('change', function() {
            const val = this.value;
            // Show order number field for specific inquiry types
            // product, quality, order, shipping, return usually imply potential existing orders
            if (['product', 'quality', 'order', 'shipping', 'return'].includes(val)) {
                orderNumberGroup.style.display = 'block';
                // Optional: Animation logic could go here
            } else {
                orderNumberGroup.style.display = 'none';
                if (orderNumberInput) orderNumberInput.value = ''; // Clear value when hidden
            }
        });
    }
    
    // Form submission
    form.addEventListener('submit', handleSubmit);
    
    function validateField(fieldName) {
        const field = document.getElementById(fieldName);
        const rule = validationRules[fieldName];
        const errorElement = document.getElementById(fieldName + 'Error');
        
        if (!field || !rule) return true;
        
        let isValid = true;
        let errorMessage = '';
        
        const value = field.type === 'checkbox' ? field.checked : field.value.trim();
        
        // Required field validation
        if (rule.required && (!value || value === '')) {
            isValid = false;
            errorMessage = rule.message;
        }
        
        // Pattern validation (for email and phone)
        else if (rule.pattern && value && !rule.pattern.test(value)) {
            isValid = false;
            errorMessage = rule.message;
        }
        
        // Min length validation
        else if (rule.minLength && value && value.length < rule.minLength) {
            isValid = false;
            errorMessage = rule.message;
        }
        
        // Display error or clear it
        if (isValid) {
            clearError(fieldName);
        } else {
            showError(fieldName, errorMessage);
        }
        
        return isValid;
    }
    
    function showError(fieldName, message) {
        const field = document.getElementById(fieldName);
        const errorElement = document.getElementById(fieldName + 'Error');
        
        if (field && errorElement) {
            field.classList.add('error');
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }
    
    function clearError(fieldName) {
        const field = document.getElementById(fieldName);
        const errorElement = document.getElementById(fieldName + 'Error');
        
        if (field && errorElement) {
            field.classList.remove('error');
            errorElement.classList.remove('show');
            errorElement.textContent = '';
        }
    }
    
    function validateForm() {
        let isFormValid = true;
        
        Object.keys(validationRules).forEach(fieldName => {
            const isFieldValid = validateField(fieldName);
            if (!isFieldValid) {
                isFormValid = false;
            }
        });
        
        return isFormValid;
    }
    
    async function handleSubmit(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            // Focus on first error field
            const firstError = form.querySelector('.error');
            if (firstError) {
                firstError.focus();
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        // Collect form data
        const formData = new FormData(form);
        
        try {
            // Submit to Netlify
            await submitToNetlify(formData);
            
            // Show success message
            showSuccessMessage();
            
        } catch (error) {
            console.error('Form submission error:', error);
            alert('申し訳ございません。送信中にエラーが発生しました。しばらく後でもう一度お試しください。');
        } finally {
            setLoadingState(false);
        }
    }
    
    function setLoadingState(isLoading) {
        submitBtn.disabled = isLoading;
        
        if (isLoading) {
            btnText.style.display = 'none';
            loadingSpinner.style.display = 'flex';
        } else {
            btnText.style.display = 'block';
            loadingSpinner.style.display = 'none';
        }
    }
    
    function showSuccessMessage() {
        form.style.display = 'none';
        successMessage.style.display = 'block';
        
        // Scroll to success message
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Track conversion (if analytics is set up)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submission', {
                'event_category': 'contact',
                'event_label': 'contact_form'
            });
        }
    }
    
    // Form submission to Netlify
    async function submitToNetlify(formData) {
        const params = new URLSearchParams(formData);
        
        // Safety check: Ensure form-name is included
        if (!params.has('form-name')) {
            params.append('form-name', 'contact');
        }

        return fetch("/contact.html", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString()
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response;
        });
    }
    
    // Reset form function (called from success message button)
    window.resetForm = function() {
        form.reset();
        form.style.display = 'block';
        successMessage.style.display = 'none';
        
        // Clear all errors
        Object.keys(validationRules).forEach(fieldName => {
            clearError(fieldName);
        });
        
        // Scroll back to form
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    
    // Enhanced UX: Auto-resize textarea
    const textarea = document.getElementById('message');
    if (textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
    
    // Enhanced UX: Format phone number as user types
    const phoneField = document.getElementById('phone');
    if (phoneField) {
        phoneField.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 6) {
                value = value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
            } else if (value.length >= 3) {
                value = value.replace(/(\d{3})(\d+)/, '$1-$2');
            }
            e.target.value = value;
        });
    }
    
    // Enhanced UX: Character counter for message field
    const messageField = document.getElementById('message');
    if (messageField) {
        const maxLength = 1000;
        const counterContainer = document.createElement('div');
        counterContainer.className = 'character-counter';
        counterContainer.style.cssText = 'text-align: right; font-size: 0.85rem; color: #666; margin-top: 5px;';
        
        const counter = document.createElement('span');
        counterContainer.appendChild(counter);
        messageField.parentNode.appendChild(counterContainer);
        
        function updateCounter() {
            const length = messageField.value.length;
            counter.textContent = `${length}/${maxLength}文字`;
            
            if (length > maxLength * 0.9) {
                counter.style.color = '#e74c3c';
            } else if (length > maxLength * 0.7) {
                counter.style.color = '#f39c12';
            } else {
                counter.style.color = '#666';
            }
        }
        
        messageField.addEventListener('input', updateCounter);
        updateCounter();
    }
});