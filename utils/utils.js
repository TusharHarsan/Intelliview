
function nullable_time_offset_to_seconds(time_offset) {
    if (!time_offset)
        return 0

    var seconds = time_offset.seconds || 0
    seconds += time_offset.nanos / 10e8 || 0
    return seconds
}

