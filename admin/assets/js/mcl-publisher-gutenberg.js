( function( wp ) {

    const { registerPlugin } = wp.plugins;
    const { PluginSidebar, PluginSidebarMoreMenuItem } = wp.editPost;
    const { PanelBody, Button, Spinner, CheckboxControl } = wp.components;
    const { useState, useEffect, Fragment } = wp.element;
    const { useSelect, useDispatch } = wp.data;
    const { __ } = wp.i18n;

// Main Sidebar Component
const PublisherChecklistSidebar = () => {
    const [checklists, setChecklists] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isChecking, setIsChecking] = useState(false);
    const [lastCheck, setLastCheck] = useState(null);
    const [isBlocking, setIsBlocking] = useState(false);

    const { editedPostContent, editedPostTitle, editedPostExcerpt, currentPost, postType, featuredMediaId, categories, tags, postMeta } = useSelect(select => {
        const editor = select('core/editor');
        const currentPostData = editor.getCurrentPost();
        
        return {
            editedPostContent: editor.getEditedPostContent(),
            editedPostTitle: editor.getEditedPostAttribute('title'),
            editedPostExcerpt: editor.getEditedPostAttribute('excerpt'),
            currentPost: currentPostData,
            postType: currentPostData?.type || 'post',
            featuredMediaId: editor.getEditedPostAttribute('featured_media'),
            categories: editor.getEditedPostAttribute('categories') || [],
            tags: editor.getEditedPostAttribute('tags') || [],
            postMeta: editor.getEditedPostAttribute('meta') || {}
        };
    });

    const { lockPostSaving, unlockPostSaving, lockPostAutosaving, unlockPostAutosaving } = useDispatch('core/editor');

    // Load checklists when component mounts or post type changes
    useEffect(() => {
        loadChecklistsForPost();
    }, [currentPost?.id, postType]);

    // Auto-check requirements when content changes
    // Content-based checks (word count, links, images, headings, alt text) are real-time
    // Database-based checks (meta descriptions, custom fields) require saving the post first
    useEffect(() => {
        if (checklists.length === 0 || isChecking || !currentPost?.id) return;

        const debounceTimer = setTimeout(() => {
            checkRequirements();
        }, 1000);

        return () => clearTimeout(debounceTimer);
    }, [editedPostContent, editedPostTitle, editedPostExcerpt, featuredMediaId, categories, tags, postMeta, checklists.length]);

    // Cleanup effect to remove event listeners when component unmounts
    useEffect(() => {
        return () => {
            // Clean up event listeners on unmount
            removePublishButtonListener();
            
            // Clean up visual indicators
            removePublishButtonIndicators();
            
            // Remove body class
            document.body.classList.remove('mcl-requirements-blocking');
            
            // Clear any intervals
            if (window.mclPublishButtonInterval) {
                clearInterval(window.mclPublishButtonInterval);
                window.mclPublishButtonInterval = null;
            }
        };
    }, []);

    const loadChecklistsForPost = async () => {
        if (!currentPost?.id) {
            setIsLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('action', 'mcl_get_publisher_checklist_data');
            formData.append('nonce', window.mclPublisher.nonce);
            formData.append('post_id', currentPost.id);

            const response = await fetch(window.mclPublisher.ajaxurl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success && data.data) {
                const checklistsData = data.data.map(checklist => ({
                    ...checklist,
                    requirements: checklist.requirements.map(req => ({
                        ...req,
                        status: 'pending',
                        message: ''
                    }))
                }));
                
                setChecklists(checklistsData);
                
                // Start initial check
                if (checklistsData.length > 0) {
                    setTimeout(() => checkRequirements(), 500);
                }
            } else {
                setChecklists([]);
            }
        } catch (error) {
            console.error('Error loading checklists:', error);
            setChecklists([]);
        } finally {
            setIsLoading(false);
        }
    };

    const checkRequirements = async () => {
        if (!currentPost?.id || isChecking || checklists.length === 0) return;

        setIsChecking(true);

        try {
            const formData = new FormData();
            formData.append('action', 'mcl_check_publisher_requirements');
            formData.append('nonce', window.mclPublisher.nonce);
            formData.append('post_id', currentPost.id);
            formData.append('post_content', editedPostContent);
            formData.append('post_title', editedPostTitle);
            formData.append('post_excerpt', editedPostExcerpt);
            formData.append('featured_media_id', featuredMediaId || '');
            formData.append('categories', JSON.stringify(categories));
            formData.append('tags', JSON.stringify(tags));
            formData.append('post_meta', JSON.stringify(postMeta));

            // Debug logging for content analysis (can be removed in production)
            if (window.mclPublisher.debug) {
                console.log('MCL Publisher: Checking requirements with content length:', editedPostContent?.length || 0);
            }

            const response = await fetch(window.mclPublisher.ajaxurl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

                        if (data.success) {
                const updatedChecklists = checklists.map(checklist => {
                    const results = data.data[checklist.id] || [];
                    return {
                        ...checklist,
                        requirements: checklist.requirements.map((req, index) => {
                            const result = results[index];
                            if (result) {
                                // Enhanced message handling for new requirement types
                                let enhancedMessage = result.message;
                                
                                // Add helpful icons and formatting for different requirement types (only if tips are enabled)
                                if (checklist.show_tips) {
                                    if (req.type === 'excerpt' && result.status === 'failed') {
                                        enhancedMessage = '📝 ' + result.message;
                                    } else if (req.type === 'excerpt' && result.status === 'passed') {
                                        enhancedMessage = '✍️ ' + result.message;
                                    } else if (req.type === 'meta_description' && result.status === 'failed') {
                                        enhancedMessage = '🔍 ' + result.message;
                                    } else if (req.type === 'meta_description' && result.status === 'passed') {
                                        enhancedMessage = '🎯 ' + result.message;
                                    } else if (req.type === 'meta_description' && result.status === 'pending') {
                                        enhancedMessage = '💾 ' + result.message;
                                    } else if (req.type === 'heading_count' && result.status === 'failed') {
                                        enhancedMessage = '📋 ' + result.message;
                                    } else if (req.type === 'heading_count' && result.status === 'passed') {
                                        enhancedMessage = '📊 ' + result.message;
                                    } else if (req.type === 'image_alt_text' && result.status === 'failed') {
                                        enhancedMessage = '♿ ' + result.message;
                                    } else if (req.type === 'image_count' && result.status === 'failed') {
                                        enhancedMessage = '🖼️ ' + result.message;
                                    } else if (req.type === 'word_count' && result.status === 'failed') {
                                        enhancedMessage = '📊 ' + result.message;
                                    } else if (req.type === 'title_length' && result.status === 'failed') {
                                        enhancedMessage = '📏 ' + result.message;
                                    } else if (req.type === 'custom_field' && result.status === 'pending') {
                                        enhancedMessage = '💾 ' + result.message;
                                    }
                                }
                                
                                return {
                                    ...req,
                                    status: result.status,
                                    message: enhancedMessage
                                };
                            }
                            return req;
                        })
                    };
                });

                setChecklists(updatedChecklists);
                setLastCheck(new Date());

                // Check if publishing should be blocked
                updatePublishingLock(updatedChecklists);
                
                // Debug logging for new requirements
                if (window.mclPublisher.debug) {
                    updatedChecklists.forEach(checklist => {
                        checklist.requirements.forEach(req => {
                            if (['excerpt', 'meta_description', 'heading_count', 'image_alt_text', 'image_count'].includes(req.type)) {
                                console.log(`MCL Publisher: ${req.type} status:`, req.status, req.message);
                            }
                        });
                    });
                }
            } else {
                // Also update publishing lock when there are no results
                updatePublishingLock([]);
            }
        } catch (error) {
            console.error('Error checking requirements:', error);
        } finally {
            setIsChecking(false);
        }
    };

    const updatePublishingLock = (checklistsData) => {
        let hasFailedRequired = false;

        checklistsData.forEach(checklist => {
            checklist.requirements.forEach(req => {
                if (req.required && req.status === 'failed') {
                    hasFailedRequired = true;
                }
            });
        });

        // Debug logging
        if (window.mclPublisher.debug) {
            console.log('MCL Publisher: Updating publish lock. Has failed required:', hasFailedRequired, 'Current blocking state:', isBlocking);
        }

        // Only update if the blocking state has actually changed
        if (hasFailedRequired !== isBlocking) {
            setIsBlocking(hasFailedRequired);
            
            if (hasFailedRequired) {
                lockPostSaving('mcl-publisher-requirements');
                lockPostAutosaving('mcl-publisher-requirements');
                
                // Add click listener to publish button to open checklist sidebar
                addPublishButtonListener();
                
                // Add visual indicators to publish button
                addPublishButtonIndicators();
                
                // Add body class for global styling
                document.body.classList.add('mcl-requirements-blocking');
            } else {
                unlockPostSaving('mcl-publisher-requirements');
                unlockPostAutosaving('mcl-publisher-requirements');
                
                // Remove the click listener when requirements are met
                removePublishButtonListener();
                
                // Remove visual indicators
                removePublishButtonIndicators();
                
                // Remove body class
                document.body.classList.remove('mcl-requirements-blocking');
                
                // Debug logging
                if (window.mclPublisher.debug) {
                    console.log('MCL Publisher: All requirements met, publish button should be functional');
                }
            }
        }
    };

    // Function to add click listener to publish button
    const addPublishButtonListener = () => {
        // Remove existing listener first to avoid duplicates
        removePublishButtonListener();
        
        // Add listener to the document to catch publish button clicks
        document.addEventListener('click', handlePublishButtonClick, true);
        
        // Debug logging
        if (window.mclPublisher.debug) {
            console.log('MCL Publisher: Added publish button click listener');
        }
    };

    // Function to remove click listener from publish button
    const removePublishButtonListener = () => {
        document.removeEventListener('click', handlePublishButtonClick, true);
        
        // Debug logging
        if (window.mclPublisher.debug) {
            console.log('MCL Publisher: Removed publish button click listener');
        }
    };

    // Handle publish button clicks when requirements are not met
    const handlePublishButtonClick = (event) => {
        const target = event.target;
        
        // Check if the clicked element is a publish button or its child elements
        const isPublishButton = target && (
            // Direct publish button classes
            target.classList.contains('editor-post-publish-button') ||
            target.classList.contains('editor-post-publish-panel__toggle') ||
            target.classList.contains('editor-post-publish-button__button') ||
            // Check if it's inside a publish button
            target.closest('.editor-post-publish-button') ||
            target.closest('.editor-post-publish-panel__toggle') ||
            target.closest('.editor-post-publish-button__button') ||
            // Check by text content (for different languages)
            (target.textContent && (
                target.textContent.includes('Publish') ||
                target.textContent.includes('Update') ||
                target.textContent.includes('Submit for Review')
            )) ||
            // Check by aria-label
            target.getAttribute('aria-label') === 'Publish' ||
            // Check data attributes that WordPress might use
            target.getAttribute('data-wp-component') === 'Button'
        );
        
        if (isPublishButton) {
            // Double-check if we should still be blocking
            if (!document.body.classList.contains('mcl-requirements-blocking')) {
                // Requirements are met, allow normal publishing
                if (window.mclPublisher.debug) {
                    console.log('MCL Publisher: Requirements are met, allowing publish to proceed');
                }
                return;
            }
            
            // Debug logging
            if (window.mclPublisher.debug) {
                console.log('MCL Publisher: Intercepting publish button click');
            }
            
            // Prevent the default action
            event.preventDefault();
            event.stopPropagation();
            
            // Open the checklist sidebar
            openChecklistSidebar();
            
            return false;
        }
    };

    // Function to open the checklist sidebar
    const openChecklistSidebar = () => {
        const { dispatch } = wp.data;
        
        try {
            // Open the plugin sidebar - using the correct sidebar name format
            dispatch('core/edit-post').openGeneralSidebar('mcl-publisher-checklist-sidebar/mcl-publisher-checklist-sidebar');
            
            // Optional: Show a notice to guide the user
            dispatch('core/notices').createNotice(
                'warning',
                __('Please complete all required checklist items before publishing.', 'magic-checklists'),
                {
                    isDismissible: true,
                    type: 'snackbar'
                }
            );
        } catch (error) {
            console.error('MCL Publisher: Error opening checklist sidebar:', error);
        }
    };

    const handleManualCheck = async (checklistId, requirementType, instanceId, checked) => {
        try {
            const formData = new FormData();
            formData.append('action', 'mcl_save_publisher_checklist_state');
            formData.append('nonce', window.mclPublisher.nonce);
            formData.append('post_id', currentPost.id);
            formData.append('checklist_id', checklistId);
            formData.append('requirement_type', requirementType);
            formData.append('instance_id', instanceId);
            formData.append('checked', checked);

            const response = await fetch(window.mclPublisher.ajaxurl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                const updatedChecklists = checklists.map(checklist => {
                    if (checklist.id === checklistId) {
                        return {
                            ...checklist,
                            requirements: checklist.requirements.map(req => {
                                if (req.type === requirementType && req.instance_id === instanceId && !req.auto_check) {
                                    return {
                                        ...req,
                                        status: checked ? 'passed' : 'failed',
                                        message: checked ? 
                                            __('Manual verification complete', 'magic-checklists') : 
                                            __('Custom item verification required', 'magic-checklists')
                                    };
                                }
                                return req;
                            })
                        };
                    }
                    return checklist;
                });

                setChecklists(updatedChecklists);
                updatePublishingLock(updatedChecklists);
            }
        } catch (error) {
            console.error('Error saving manual check:', error);
        }
    };

    const getOverallStatus = () => {
        if (checklists.length === 0) return 'none';
        
        let hasRequired = false;
        let hasFailedRequired = false;
        let hasPendingRequired = false;

        checklists.forEach(checklist => {
            const requiredRequirements = checklist.requirements.filter(req => req.required);
            if (requiredRequirements.length > 0) {
                hasRequired = true;
                if (requiredRequirements.some(req => req.status === 'failed')) {
                    hasFailedRequired = true;
                }
                if (requiredRequirements.some(req => req.status === 'pending')) {
                    hasPendingRequired = true;
                }
            }
        });

        if (!hasRequired) return 'none';
        if (hasFailedRequired) return 'failed';
        if (hasPendingRequired) return 'pending';
        return 'passed';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'passed':
                return '✅';
            case 'failed':
                return '❌';
            case 'pending':
                return '⏳';
            default:
                return '⚪';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'passed':
                return '#22c55e';
            case 'failed':
                return '#ef4444';
            case 'pending':
                return '#f59e0b';
            default:
                return '#94a3b8';
        }
    };

    const getRequirementTip = (requirement) => {
        const tips = {
            'excerpt': 'Excerpt helps users understand your content before reading. Check character limits in the excerpt section.',
            'meta_description': 'Meta descriptions appear in search results. Keep within SEO-recommended character limits.',
            'heading_count': 'Proper heading structure (H2, H3, H4) improves readability and SEO.',
            'word_count': 'Adequate content length helps with SEO and provides value to readers.',
            'title_length': 'Title length affects how it displays in search results and social media.',
            'featured_image': 'Featured images improve engagement and social media sharing.',
            'categories': 'Categories help organize your content and improve navigation.',
            'tags': 'Tags help readers discover related content and improve SEO.',
            'external_links': 'External links to authoritative sources add credibility to your content.',
            'internal_links': 'Internal links help readers explore related content and improve SEO.',
            'image_alt_text': 'Alt text makes images accessible to screen readers and improves SEO.',
            'image_count': 'Images make content more engaging and help break up text.',
            'custom_field': 'Custom fields store additional metadata for your content.',
            'custom_item': 'Manual verification items require human review before publishing.'
        };
        
        return tips[requirement.type] || 'Complete this requirement before publishing.';
    };

    // Function to add visual indicators to publish buttons
    const addPublishButtonIndicators = () => {
        const addIndicatorToButton = (button) => {
            if (button && !button.classList.contains('is-locked')) {
                button.classList.add('is-locked');
                button.title = __('Complete checklist requirements to publish', 'magic-checklists');
            }
        };
        
        // Find and mark publish buttons
        const publishButtons = document.querySelectorAll(
            '.editor-post-publish-button, .editor-post-publish-panel__toggle, .editor-post-publish-button__button'
        );
        
        publishButtons.forEach(addIndicatorToButton);
        
        // Set up periodic check to catch dynamically added buttons
        if (!window.mclPublishButtonInterval) {
            window.mclPublishButtonInterval = setInterval(() => {
                if (document.body.classList.contains('mcl-requirements-blocking')) {
                    const newButtons = document.querySelectorAll(
                        '.editor-post-publish-button:not(.is-locked), .editor-post-publish-panel__toggle:not(.is-locked), .editor-post-publish-button__button:not(.is-locked)'
                    );
                    newButtons.forEach(addIndicatorToButton);
                }
            }, 1000);
        }
    };

    // Function to remove visual indicators from publish buttons
    const removePublishButtonIndicators = () => {
        const removeIndicatorFromButton = (button) => {
            if (button) {
                button.classList.remove('is-locked');
                button.removeAttribute('title');
            }
        };
        
        // Find and unmark publish buttons
        const publishButtons = document.querySelectorAll(
            '.editor-post-publish-button, .editor-post-publish-panel__toggle, .editor-post-publish-button__button'
        );
        
        publishButtons.forEach(removeIndicatorFromButton);
        
        // Clear the periodic check
        if (window.mclPublishButtonInterval) {
            clearInterval(window.mclPublishButtonInterval);
            window.mclPublishButtonInterval = null;
        }
    };

    if (isLoading) {
        return null; // Don't render anything while loading
    }

    return wp.element.createElement(
        Fragment,
        null,
        wp.element.createElement(
            PluginSidebarMoreMenuItem,
            {
                target: "mcl-publisher-checklist-sidebar",
                icon: "yes-alt"
            },
            window.mclPublisher?.i18n?.publisherChecklist || __('Publisher Checklist', 'magic-checklists')
        ),
        
        wp.element.createElement(
            PluginSidebar,
            {
                name: "mcl-publisher-checklist-sidebar",
                title: window.mclPublisher?.i18n?.publisherChecklist || __('Publisher Checklist', 'magic-checklists'),
                icon: "yes-alt"
            },
            wp.element.createElement(
                'div',
                { className: "mcl-publisher-sidebar" },
                checklists.length === 0 ? 
                    wp.element.createElement(
                        'div',
                        { style: { padding: '20px', textAlign: 'center' } },
                        wp.element.createElement('p', null, __('No publisher checklists configured for this post type.', 'magic-checklists'))
                    ) :
                    checklists.map(checklist => {
                        const checklistStatus = checklist.requirements.length > 0 ? 
                            (checklist.requirements.filter(req => req.required).every(req => req.status === 'passed') ? 'passed' : 
                             checklist.requirements.filter(req => req.required).some(req => req.status === 'failed') ? 'failed' : 'pending') : 'none';
                        
                        return wp.element.createElement(
                            PanelBody,
                            {
                                key: checklist.id,
                                title: wp.element.createElement(
                                    'div',
                                    { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                                    wp.element.createElement(
                                        'span',
                                        { style: { fontSize: '16px' } },
                                        getStatusIcon(checklistStatus)
                                    ),
                                    wp.element.createElement('span', null, checklist.title),
                                    isChecking && wp.element.createElement(Spinner, { style: { width: '16px', height: '16px' } })
                                ),
                                initialOpen: true
                            },
                            checklist.description && wp.element.createElement(
                                'p',
                                { 
                                    style: { 
                                        fontSize: '14px', 
                                        color: '#666', 
                                        marginBottom: '15px',
                                        lineHeight: '1.4'
                                    }
                                },
                                checklist.description
                            ),

                            wp.element.createElement(
                                'div',
                                { className: "mcl-requirements-list" },
                                checklist.requirements.map((requirement, index) => 
                                                            wp.element.createElement(
                            'div',
                            {
                                key: `${checklist.id}-${requirement.type}-${index}`,
                                className: "mcl-requirement-item",
                                'data-requirement-type': requirement.type,
                                'data-status': requirement.status,
                                style: {
                                    position: 'relative',
                                    padding: '12px',
                                    marginBottom: '8px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    backgroundColor: requirement.status === 'passed' ? '#f0fdf4' : 
                                                    requirement.status === 'failed' ? '#fef2f2' : '#fffbeb'
                                }
                            },
                                                                    // Required badge positioned absolutely in top right
                            requirement.required && wp.element.createElement(
                                'span',
                                {
                                    style: {
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        backgroundColor: '#f2da22',
                                        color: '#1a1a1a',
                                        padding: '2px 6px',
                                        borderRadius: '10px',
                                        fontSize: '10px',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        zIndex: 1
                                    }
                                },
                                __('Required', 'magic-checklists')
                            ),
                            
                            wp.element.createElement(
                                'div',
                                { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' } },
                                wp.element.createElement(
                                    'span',
                                    { 
                                        style: { 
                                            fontSize: '16px',
                                            lineHeight: '1.2',
                                            minWidth: '20px'
                                        }
                                    },
                                    getStatusIcon(requirement.status)
                                ),
                                
                                wp.element.createElement(
                                    'div',
                                    { style: { flex: 1, minWidth: 0, width: '100%' } },
                                    wp.element.createElement(
                                        'div',
                                        { 
                                            style: { 
                                                display: 'flex',
                                                width: '100%',
                                                alignItems: 'center',
                                                gap: '6px',
                                                marginBottom: '4px',
                                                paddingRight: requirement.required ? '60px' : '0'
                                            }
                                        },
                                        wp.element.createElement(
                                            'span',
                                            { 
                                                style: { 
                                                    fontWeight: '500',
                                                    fontSize: '14px',
                                                    color: '#1a1a1a'
                                                }
                                            },
                                            requirement.label
                                        )
                                    ),
                                                
                                                
                                                
                                                requirement.message && wp.element.createElement(
                                                    'p',
                                                    {
                                                        style: {
                                                            fontSize: '12px',
                                                            color: getStatusColor(requirement.status),
                                                            fontWeight: '500',
                                                            margin: '0'
                                                        }
                                                    },
                                                    requirement.message
                                                ),
                                                
                                                // Show helpful tip for failed requirements
                                                requirement.status === 'failed' && checklist.show_tips && wp.element.createElement(
                                                    'div',
                                                    {
                                                        style: {
                                                            fontSize: '11px',
                                                            color: '#64748b',
                                                            marginTop: '4px',
                                                            padding: '6px 8px',
                                                            backgroundColor: '#f8fafc',
                                                            borderRadius: '4px',
                                                            border: '1px solid #e2e8f0',
                                                            lineHeight: '1.3'
                                                        }
                                                    },
                                                    '💡 ' + getRequirementTip(requirement)
                                                ),
                                                
                                                !requirement.auto_check && wp.element.createElement(
                                                    CheckboxControl,
                                                    {
                                                        label: __('Mark as complete', 'magic-checklists'),
                                                        checked: requirement.status === 'passed',
                                                        onChange: (checked) => 
                                                            handleManualCheck(checklist.id, requirement.type, requirement.instance_id || '', checked),
                                                        style: { fontSize: '12px' }
                                                    }
                                                )
                                            )
                                        )
                                    )
                                )
                            ),

                            wp.element.createElement(
                                'div',
                                { 
                                    style: { 
                                        marginTop: '15px',
                                        padding: '12px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        color: '#64748b'
                                    }
                                },
                                checklistStatus === 'passed' && wp.element.createElement(
                                    'div',
                                    { style: { color: '#22c55e', fontWeight: '500' } },
                                    '✅ ' + __('All requirements met!', 'magic-checklists')
                                ),
                                checklistStatus === 'failed' && wp.element.createElement(
                                    'div',
                                    { style: { color: '#ef4444', fontWeight: '500' } },
                                    '⚠️ ' + __('Some required items need attention before publishing.', 'magic-checklists')
                                ),
                                checklistStatus === 'pending' && wp.element.createElement(
                                    'div',
                                    { style: { color: '#f59e0b', fontWeight: '500' } },
                                    '⏳ ' + __('Checking requirements...', 'magic-checklists')
                                ),
                                
                                lastCheck && wp.element.createElement(
                                    'div',
                                    { style: { marginTop: '8px' } },
                                    __('Last checked:', 'magic-checklists') + ' ' + lastCheck.toLocaleTimeString()
                                )
                            ),

                            wp.element.createElement(
                                Button,
                                {
                                    variant: "secondary",
                                    onClick: checkRequirements,
                                    disabled: isChecking,
                                    style: { marginTop: '10px', width: '100%' }
                                },
                                isChecking ? 
                                    wp.element.createElement(
                                        Fragment,
                                        null,
                                        wp.element.createElement(Spinner, { style: { width: '16px', height: '16px', marginRight: '8px' } }),
                                        __('Checking...', 'magic-checklists')
                                    ) :
                                    __('Check Requirements', 'magic-checklists')
                            )
                        );
                    })
            )
        )
    );
};

// Register the plugin
registerPlugin('mcl-publisher-checklist-sidebar', {
    render: PublisherChecklistSidebar
});

// Add custom styles
const style = document.createElement('style');
style.textContent = `
.mcl-publisher-sidebar .components-panel__body-title {
    font-size: 14px !important;
    font-weight: 600 !important;
}

.mcl-publisher-sidebar .components-panel__body {
    border-bottom: 1px solid #e2e8f0 !important;
}

.mcl-publisher-sidebar .components-panel__body:last-child {
    border-bottom: none !important;
}

.mcl-requirement-item {
    transition: all 0.2s ease !important;
}

.mcl-requirement-item:hover {
    box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
}

.mcl-publisher-sidebar .components-checkbox-control__label {
    font-size: 12px !important;
    color: #64748b !important;
}

.mcl-publisher-sidebar .components-base-control__field {
    margin-bottom: 0 !important;
}

@keyframes mcl-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.mcl-checking .mcl-requirement-item {
    animation: mcl-pulse 1.5s ease-in-out infinite;
}
`;
document.head.appendChild(style);

} )( window.wp ); 