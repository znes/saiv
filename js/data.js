function jsonmanager () {
	var that = this;
	this.json = null;

	this.newData = function(_data) {
		this.json = _data;
	}

	this.removeElement = function() {

	}

	this.updateScenario = function(data) {
		console.log(description);
		console.log(this.json);
		this.json.name = data.name;
		this.json.tags.description = data.tags.description;
	}

	this.updateRelationNames = function(newName, oldName) {
		for (var i = 0; i < this.json.children.length; i++) {
			for (var j = 0; j < this.json.children[i].predecessors.length; j++) {
				if(this.json.children[i].predecessors[j] == oldName) {
					this.json.children[i].predecessors[j] = newName;
				}
			}
			for (var j = 0; j < this.json.children[i].successors.length; j++) {
				if(this.json.children[i].successors[j] == oldName) {
					this.json.children[i].successors[j] = newName;
				}
			}
		}
	}

	this.updateChildren = function(updateData) {
		this.json.children = $.grep(this.json.children, function (child) {
            return child.name != updateData.currentid;
        });

        // if name(id) changes
        if(updateData.currentid != updateData.name) {
        	that.updateRelationNames(updateData.name, updateData.currentid);
        }
        delete updateData['currentid'];


        // Add Successor and Predecessors to other
        for (var i = 0; i < updateData.successors.length; i++) {
        	var index = this.json.children.findIndex(x => x.name==updateData.successors[i]);
			if (index !== -1) {
				this.json.children[index].predecessors.indexOf(updateData.name) === -1 ? this.json.children[index].predecessors.push(updateData.name) : console.log("This item already exists");
			}
        }
        for (var i = 0; i < updateData.predecessors.length; i++) {
        	var index = this.json.children.findIndex(x => x.name==updateData.predecessors[i]);
			if (index !== -1) {
				this.json.children[index].successors.indexOf(updateData.name) === -1 ? this.json.children[index].successors.push(updateData.name) : console.log("This item already exists");
			}
        }

        // Check if something has been removed
        for (var i = 0; i < this.json.children.length; i++) {
        	var index = this.json.children[i].predecessors.indexOf(x => x.name==updateData.predecessors[i]);
        	if( index !== -1)
        	{
        		updateData.successors.indexOf(this.json.children[i].name) === -1 ? delete this.json.children[i].predecessors[index] : console.log("Bereits drin");
        	}

        	index = this.json.children[i].successors.indexOf(updateData.name)
        	if( index !== -1)
        	{
        		updateData.predecessors.indexOf(this.json.children[i].name) === -1 ? delete this.json.children[i].successors[index] : console.log("Bereits drin");
        	}
        }
        this.json.children.push(updateData);
    }
}