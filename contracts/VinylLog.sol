// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VinylLog {
    uint256 public nextLogId = 1;

    struct LogEntry {
        address listener;
        string track;
        string artist;
        string vibe;
        string note;
        uint256 createdAt;
    }

    mapping(uint256 => LogEntry) private logs;

    event LogCreated(
        uint256 indexed logId,
        address indexed listener,
        string track,
        string artist,
        string vibe
    );

    function createLog(
        string calldata track,
        string calldata artist,
        string calldata vibe,
        string calldata note
    ) external returns (uint256 logId) {
        require(bytes(track).length > 0 && bytes(track).length <= 42, "Invalid track");
        require(bytes(artist).length > 0 && bytes(artist).length <= 36, "Invalid artist");
        require(bytes(vibe).length > 0 && bytes(vibe).length <= 18, "Invalid vibe");
        require(bytes(note).length <= 160, "Invalid note");

        logId = nextLogId++;
        logs[logId] = LogEntry({
            listener: msg.sender,
            track: track,
            artist: artist,
            vibe: vibe,
            note: note,
            createdAt: block.timestamp
        });

        emit LogCreated(logId, msg.sender, track, artist, vibe);
    }

    function getLog(
        uint256 logId
    )
        external
        view
        returns (
            address listener,
            string memory track,
            string memory artist,
            string memory vibe,
            string memory note,
            uint256 createdAt
        )
    {
        LogEntry storage entry = logs[logId];
        return (
            entry.listener,
            entry.track,
            entry.artist,
            entry.vibe,
            entry.note,
            entry.createdAt
        );
    }
}
