const getPaginationOffset = (pageNumber, pageSize) => {
    // formula:
    /*
        - start row = index page * size data show

        e.g:
        1. page 1 size 10. The meaning is page 1 with (max) 10 data show.
            - (1 - 1) * 10 = 0. ---> Data fetching start from row 0
        2. page 2 size 10. The meaning is page 2 with (max) 10 data show.
            - (2 - 1) * 10 = 10. ---> Data fetching start from row 10
    */

    const paginationOffset = (pageNumber - 1) * pageSize;;

    return paginationOffset;
}

const getPaginationTotalPages = (totalItems, pageSize) => {
    return Math.ceil(totalItems / pageSize);
}

module.exports = {
    getPaginationOffset,
    getPaginationTotalPages
}
