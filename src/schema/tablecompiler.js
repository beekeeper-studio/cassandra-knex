import TableCompiler from 'knex/lib/schema/tablecompiler';
import { isObject } from 'knex/lib/util/is';
import { isString } from 'lodash';

class TableCompiler_Cassandra extends TableCompiler {
	tablePrimaryKey = '';
	
	// Create a new table.
	createQuery(columns, ifNot) {
		if (ifNot) throw new Error('createQuery ifNot not implemented');
		let sql = 
			'create table ' + this.tableName() + ' (' + columns.sql.join(', ');

		sql += this.tablePrimaryKey;
		sql += ')';

		this.pushQuery(sql);
	}

	//TODO@DAY Index, comment, addColumns, alterColumns, dropColumn, renameColumn, dropIndex, dropPrimary?
	// columns should start with all of the partition keys
	// adding lastPartitionKey to the `options` argument, which will be the index of the last entry for the partition key 
	primary(columns, constraintName) {
		let deferrable, lastPartitionKey;
		if (isObject(constraintName)) {
			({ constraintName, deferrable, partitionKey: lastPartitionKey } = constraintName);
		}
		if (deferrable && deferrable !== 'not deferrable') {
			this.client.logger.warn(
				`cassandra: primary key constraint [${constraintName}] will not be deferrable ${deferrable} because Cassandra does not support deferred constraints.`
			);
		}

		let partitions = []
		if (lastPartitionKey && !isString(columns)) {
			partitions = columns.slice(0, lastPartitionKey + 1);
			columns = columns.slice(lastPartitionKey + 1);
		}

		let partitionStr = '';
		if (partitions.length > 0) {
			partitionStr = `(${partitions.join(', ')}), `
		}

		if (!this.forCreate) {
			//alter query here
		} else {
			this.tablePrimaryKey = `PRIMARY KEY $(${partitionStr}${columns.join(', ')})`;
		}
	}
}

TableCompiler_Cassandra.prototype.createAlterTableMethods = ['primary'];
TableCompiler_Cassandra.prototype.lowerCase = false;
// TableCompiler_Cassandra.prototype.
// TableCompiler_Cassandra.prototype.
// TableCompiler_Cassandra.prototype.

module.exports = TableCompiler_Cassandra;
