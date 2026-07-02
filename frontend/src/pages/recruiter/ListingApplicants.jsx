import client from "@/api/client"
import { useEffect, useState } from "react"

export default function ListingApplicants() {{
    const { id } = useParams()
    const [apps, setApps] = useState([])
    const [title, setTitle] = useState('')

    useEffect(() => {
        client.get(`/listings/${id}`).then(({data}) => setTitle(data.title))
        client.get(`/listings`)
    })
}