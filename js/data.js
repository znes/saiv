class DataManager {
	constructor() {
		this._json = null
    }

    set json  (paraJson)  { this._json = paraJson }
    get json  ()       { return this._json }


	updateScenario (data) {	
		this._json.name = data.name
		this._json.tags.description = data.tags.description
	}

	updateRelationNames (newName, oldName) {
		this._json.children.forEach(child => {
			child.predecessors.forEach(pred => {
				if(pred == oldName) pred = newName
			})
			child.successors.forEach(succ => {
				if(succ == oldName) succ = newName
			})
		})
	}

	addNode (child) {
		this._json.children.push(child)
	}

	/**
	 * [addEdge description]
	 * Adds predecessors and successors
	 * Return boolean of success 
	 * @param {[type]} predecessors [description]
	 * @param {[type]} successors   [description]
	 */
	addEdge (predecessors, successors) {
		// Add Successor
		var index = this._json.children.findIndex(x => x.name==predecessors)
		if (index !== -1) {
			if(this._json.children[index].successors.indexOf(successors) === -1) {
				this._json.children[index].successors.push(successors)
			} else {
				return false
			}
		}
		// Add Predecessor
		index = this._json.children.findIndex(x => x.name==successors)
		if (index !== -1) {
			this._json.children[index].predecessors.indexOf(predecessors) === -1 ? this._json.children[index].predecessors.push(predecessors) : console.log("This item already exists");
		}
		return true
	}

	deleteItem (name) {
		this._json.children = $.grep(this._json.children, function (child) {
            return child.name != name
        });

		this.deleteRelationNames(name)
	}

	updateChildren (updateData) {
		this._json.children = this._json.children.filter(child => child.name != updateData.currentid)

        // if name(id) changes
        if(updateData.currentid != updateData.name) this.updateRelationNames(updateData.name, updateData.currentid)


        delete updateData['currentid']


        // Add Successor and Predecessors to other
        updateData.successors.forEach(child => {
        	let index = this._json.children.findIndex(x => x.name==child)
			if (index !== -1) {
				if(this._json.children[index].predecessors.indexOf(updateData.name) === -1) this._json.children[index].predecessors.push(updateData.name)
			}
        })
        updateData.predecessors.forEach(child => {
        	let index = this._json.children.findIndex(x => x.name==child)
			if (index !== -1) {
				if(this._json.children[index].successors.indexOf(updateData.name) === -1) this._json.children[index].successors.push(updateData.name)
			}
        })

        // Check if something has been removed
        this._json.children.forEach(child => {
        	let index = child.predecessors.indexOf(updateData.name)
        	if( index !== -1)
        	{
        		if(updateData.successors.indexOf(child.name) === -1) delete child.predecessors[index]
        	}

        	index = child.successors.indexOf(updateData.name)
        	if( index !== -1)
        	{
        		if(updateData.predecessors.indexOf(child.name) === -1) delete child.successors[index]
        	}
        })
        this._json.children.push(updateData)
    }

    addTag (name, tagName) {
    	let index = this._json.children.findIndex(x => x.name==name)

    	if( index !== -1)
    		this._json.children[index].tags[tagName] = ""
    }

    removeTag (name, tagName) {
    	let index = this._json.children.findIndex(x => x.name==name)

    	if( index !== -1)
    		delete this._json.children[index].tags[tagName]
    }

    deleteRelationNames (name) {
    	this._json.children.forEach(child => {
    		child.predecessors.forEach((pred, index) =>  {
				child.predecessors.splice(index,1);
    		})
    		child.successors.forEach((succ, index) =>  {
				child.successors.splice(index,1);
    		})

    	})
    }
}