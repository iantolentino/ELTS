<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function getDb(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
    return $pdo;
}

function dbQuery(string $sql, array $params = []): PDOStatement
{
    $stmt = getDb()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

function dbFetchOne(string $sql, array $params = []): ?array
{
    $row = dbQuery($sql, $params)->fetch();
    return $row === false ? null : $row;
}

function dbFetchAll(string $sql, array $params = []): array
{
    return dbQuery($sql, $params)->fetchAll();
}

function dbInsert(string $table, array $data): int
{
    $columns = array_keys($data);
    $placeholders = array_map(fn(string $c): string => ':' . $c, $columns);
    $sql = sprintf(
        'INSERT INTO %s (%s) VALUES (%s)',
        $table,
        implode(', ', $columns),
        implode(', ', $placeholders)
    );
    dbQuery($sql, $data);
    return (int) getDb()->lastInsertId();
}

// $whereSql must use named placeholders (e.g. "id = :id"), never inline values —
// it is concatenated as-is, so it bypasses PDO's escaping if literals are embedded directly.
function dbUpdate(string $table, array $data, string $whereSql, array $whereParams = []): int
{
    $set = implode(', ', array_map(fn(string $c): string => "$c = :$c", array_keys($data)));
    $sql = "UPDATE $table SET $set WHERE $whereSql";
    return dbQuery($sql, array_merge($data, $whereParams))->rowCount();
}

function dbDelete(string $table, string $whereSql, array $whereParams = []): int
{
    $sql = "DELETE FROM $table WHERE $whereSql";
    return dbQuery($sql, $whereParams)->rowCount();
}
