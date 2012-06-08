labelBySharingType = {
  'rent': "Rent",
  'gift': "Gift",
  'use-together': "Use Together"
}

# For nows it's only localizing for English :-)
class Localizer
  sharingType:  (sharingType) -> labelBySharingType[sharingType] || sharingType;


#export
this.Localizer = Localizer