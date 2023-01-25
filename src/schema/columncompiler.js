import ColumnCompiler from "knex/lib/schema/columncompiler";


class ColumnCompiler_Cassandra extends ColumnCompiler {
  constructor(client, tableCompiler, columnBuilder) {
    super(client, tableCompiler, columnBuilder);
    // NOTE@DAY Cassandra doesn't seem to have any modifiers ?
    this.modifiers = [];
  }

  text(column) {
    if (column == 'text' || column == 'varchar') return column;
    else return 'ascii';
  }

  map(key, value) {
    return `map<${key}, ${value}>`;
  }

  set(value) {
    return `set<${value}>`;
  }

  list(value) {
    return `list<${value}>`;
  }

  tuple(values) {
    return `tuple<${values.join(', ')}>`;
  }
  
}

ColumnCompiler_Cassandra.prototype.double = 'double';
ColumnCompiler_Cassandra.prototype.decimal = 'decimal';
ColumnCompiler_Cassandra.prototype.float = 'float';
ColumnCompiler_Cassandra.prototype.integer = 'int';
ColumnCompiler_Cassandra.prototype.bigint = 'bigint';
ColumnCompiler_Cassandra.prototype.tinyint = 'tinyint';
ColumnCompiler_Cassandra.prototype.date = 'date';
ColumnCompiler_Cassandra.prototype.timestamp = 'timestamp';
ColumnCompiler_Cassandra.prototype.time = 'time';
ColumnCompiler_Cassandra.prototype.duration = 'duration';
ColumnCompiler_Cassandra.prototype.timeuuid = 'timeuuid';
ColumnCompiler_Cassandra.prototype.blob = 'blob';
ColumnCompiler_Cassandra.prototype.bool = 'boolean';
ColumnCompiler_Cassandra.prototype.counter = 'counter';
ColumnCompiler_Cassandra.prototype.inet = 'inet';
ColumnCompiler_Cassandra.prototype.uuid = 'uuid';

module.exports = ColumnCompiler_Cassandra;