interface coordinates{
    altitude: number
    heading: number
    altitudeAccuracy: number
    latitude: number
    speed: number
    longitude: number
    accuracy: number
}

interface locationData{
    timestamp: number
    mocked: boolean
    coords: coordinates
}

export interface geolocation{
    locations: locationData[]
}