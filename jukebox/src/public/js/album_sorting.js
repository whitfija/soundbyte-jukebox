document.addEventListener('DOMContentLoaded', () => {
    const gridView = document.getElementById('sortable-grid');
    const listView = document.getElementById('sortable-list');
    const saveButton = document.getElementById('saveOrder');

    // init sortable
    const sortableOptions = {
        // animation: 150,
        swapThreshold: 1,
        ghostClass: 'sortable-ghost',
        multiDrag: true,
        selectedClass: 'selected',
        fallbackTolerance: 3,
        onEnd: () => syncViews(isGridView) 
    };

    const sortableGrid = new Sortable(gridView, sortableOptions);
    const sortableList = new Sortable(listView, sortableOptions);

    // sync views
    const syncViews = (isGrid) => {
        if (isGrid) {
            syncFromTo(gridView, listView);
        } else {
            syncFromTo(listView, gridView);
        }
    };
    const syncFromTo = (sourceView, targetView) => {
        const sourceItems = Array.from(sourceView.children);
        const targetItems = Array.from(targetView.children);

        const newOrder = sourceItems.map(item => item.dataset.id);
    
        const fragment = document.createDocumentFragment();
    
        newOrder.forEach(id => {
            const targetItem = targetItems.find(item => item.dataset.id === id);
            if (targetItem) {
                fragment.appendChild(targetItem); 
            }
        });

        targetView.innerHTML = '';  
        targetView.appendChild(fragment);
    };

    // collect new order to save
    const getNewOrder = () => {
        const currentView = gridView.style.display === 'none' ? listView : gridView;
        const items = currentView.querySelectorAll('[data-id]');
        
        return Array.from(items).map((item, index) => ({
            id: item.dataset.id,
            ranking: index + 1
        }));
    };

    // save the new order
    saveButton.addEventListener('click', async () => {
        const newOrder = getNewOrder();

        try {
            const response = await fetch('/album/save-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ albums: newOrder })
            });

            if (response.ok) {
                alert('album order saved successfully!');
            } else {
                console.error('failed to save order');
                alert('failed to save order');
            }
        } catch (error) {
            console.error('error saving order:', error);
            alert('error saving order');
        }
    });
});
