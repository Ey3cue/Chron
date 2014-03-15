/* ----------
   priorityQueue.js

   Implements a priority queue which, in addition to ordering items according priority, also
   sub-orders them by first-come first serve. That is, if two items are inserted into the queue with
   the same priority, the first inserted will be the first to be returned.

   The implmentation to accomplish this is a heap of queues.
   ---------- */

var PriorityQueue;

(function () {

/**
 * Creates a new priority queue.
 *
 * @param {Function} compare a function used to compare the priority of two items
 */
PriorityQueue = function (compare) {
    this.heap = [];
    this.compare = compare;
};

PriorityQueue.prototype.add =
PriorityQueue.prototype.enqueue = function (item) {
    if (arguments.length > 1) {
        for (var j = 0; j < arguments.length; j++) {
            this.add(arguments[j]);
        }
        return;
    }

    // Check if heap already contains a queue with the same priority as the new request
    //   Sequential search is performed here; the number of unique priorities is expected to be low
    for (var i = this.heap.length - 1; i >= 0; i--) {
        if (this.compare(item, this.heap[i][0]) === 0) {
            this.heap[i].push(item);
            return;
        }
    }

    // Add new queue to end of heap and add new request to it
    this.heap.push([item]);

    // Trickle up
    var index = this.heap.length - 1;
    var parentIndex = Math.floor((index - 1) * 0.5);

    while (parentIndex >= 0 && this.compare(this.heap[index][0], this.heap[parentIndex][0]) > 0) {
        var temp = this.heap[parentIndex];
        this.heap[parentIndex] = this.heap[index];
        this.heap[index] = temp;

        index = parentIndex;
        parentIndex = Math.floor((index - 1) * 0.5);
    }
};

PriorityQueue.prototype.remove =
PriorityQueue.prototype.dequeue = function () {
    if (!this.heap.length) {
        return null;
    }

    var item = this.heap[0].shift();

    if (!this.heap[0].length) {
        // Last queue in the heap
        if (this.heap.length === 1) {
            this.heap.shift();
            return item;
        }

        // Remove the empty queue, move last queue to the root, and rebuild
        this.heap[0] = this.heap.pop();
        heapRebuild(this.heap, 0, this.compare);
    }

    return item;
};

PriorityQueue.prototype.isEmpty = function () {
    return !this.heap.length;
};

PriorityQueue.prototype.size = function () {
    return this.heap.length;
};

PriorityQueue.prototype.toString = function () {
    return toString(this.heap, 0);
};

function toString(heap, index) {
    if (index >= heap.length) {
        return index <= 1 ? '[]' : '';
    }

    var node = heap[index];
    var nodeString = '';

    for (var i = 0; i < node.length; i++) {
        nodeString += node[i].toString() + ';';
    }
    nodeString = nodeString.substring(0, nodeString.length - 1);

    var childIndex = 2 * index + 1;
    var leftChild = toString(heap, childIndex);
    var rightChild = toString(heap, childIndex + 1);

    return '[' + nodeString + leftChild + rightChild + ']';
}

function heapRebuild(heap, root, compare) {
    var child = 2 * root + 1;

    // Check if root is a leaf
    if (child < heap.length) {
        var rightChild = child + 1;

        // If the root has a right child and the right child takes priority over the left
        if (rightChild < heap.length && compare(heap[rightChild][0], heap[child][0]) > 0) {
            // Make the right child the child to potentially swap with
            child = rightChild;
        }

        if (compare(heap[root][0], heap[child][0]) < 0) {
            // Swap queues
            var temp = heap[root];
            heap[root] = heap[child];
            heap[child] = temp;

            // Rebuild from the child's index
            heapRebuild(heap, child, compare);
        }
    }
}

})();
