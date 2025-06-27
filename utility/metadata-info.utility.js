const getMetadataInfo = (req) => {
    return {
      penggunaId: req.penggunaId,
      jabatanId: req.jabatanId,
      level: req.levelData,
      currentDatetime: req.datetime
    };
  }

module.exports = {
    getMetadataInfo
}
