// hold POTA api json types

export interface ParkInfo {
    parkId: number
    reference: string
    name: string
    latitude: number
    longitude: number
    grid4: string
    grid6: string
    parktypeId: number
    active: number,
    parkComments: string
    accessibility: null
    sensitivity: null
    accessMethods: string
    activationMethods: string
    agencies: null
    agencyURLs: null
    parkURLs: null
    website: string
    createdByAdmin: string
    parktypeDesc: string
    locationDesc: string
    locationName: string
    entityId: number
    entityName: string
    referencePrefix: string
    entityDeleted: number
    firstActivator: string
    firstActivationDate: string
}

export interface ParkStats {
    reference: string
    attempts: number
    activations: number
    contacts: number
}