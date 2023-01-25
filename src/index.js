import Client from 'knex/lib/client';
import { promisify } from 'node:util';

//TEMP@DAY
function TODO() {
	return new Error('This functionality has not been implemented yet!!!');
}

class Client_Cassandra extends Client {
	_driver() {
		return require('cassandra-driver');
	}

	schemaCompiler() {
		throw TODO();
	}

	queryCompiler(builder, formatter) {
		throw TODO();
	}

	columnBuilder() {
		throw TODO();
	}

	tableCompiler() {
		throw TODO();
	}

	transaction() {
		throw TODO();
	}

	wrapIdentifierImpl(value) {
		throw TODO();
		//TODO@DAY this function seems to be completely useless in the firebird implementation?! Investigate further
	}

	// get a raw connection, called by the `pool` whenever a new
	// connection needs to be added to the pool.
	// NOTE@DAY it seems that cassandra-driver already handles connection pooling, so we may be able to get around this completely?
	// (we may also have to figure out a way to fake it so that knex doesn't get angry)
	acquireRawConnection() {
		return new Promise((resolve, reject) => {
			const connection = new this.driver.Client(this.connectionSettings);
			connection.connect()
				.then(() => {
					console.log('Connected to cluster with %d host(s): %j', connection.hosts.length);
					resolve(connection);				
				})
				.catch((err) => {
					console.error('There was an error while connecting', err);
					reject(err);
				});
		});
	}

	async destroyRawConnection(connection) {
		return new Promise((resolve, reject) => {
			connection.shutdown()
				.then(() => resolve())
				.catch((err) => reject(err));
		});
	}

	// NOTE@DAY skipping over some functions here

	//Runs a query on the specified connection, providing the bindings and any other necessary prep work.
	_query(connection, obj) {
		if (!obj || typeof obj === 'string') obj = { sql: obj };
		if (!obj.sql) throw new Error('The query is empty');

		return new Promise((resolve, reject) => {
			if (!obj.sql) {
				resolve();
				return;
			}
			connection.execute(
				obj.sql,
				obj.bindings,
				obj.options,
				(err, result) => {
					if (err) return reject(err);
					//needs to be formatted as [rows, fields]
					obj.response = result;
					console.log(result);
					resolve(obj);
				}
			);
		});
	}
}
